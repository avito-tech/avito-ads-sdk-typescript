/**
 * Транспортный HTTP-слой поверх fetch.
 *
 * Здесь сосредоточена логика выполнения запроса:
 * - подстановка заголовка Authorization со свежим токеном на каждой попытке;
 * - повторы при 429 и 5xx с экспоненциальной задержкой и учётом Retry-After;
 * - однократное обновление токена и повтор при 401;
 * - повтор при сетевых ошибках и таймаутах;
 * - таймаут запроса через AbortController;
 * - разбор тела и заголовка Api-Point-Balance;
 * - отображение кодов состояния на типизированные ошибки.
 */

import { baseUri, type FetchLike, type ResolvedConfig } from '../config.js';
import { AvitoApiError, createApiError, NetworkError } from '../errors.js';
import type { TokenProvider } from '../token.js';

/** Результат успешного запроса. */
export interface ApiResponse<T> {
  data: T;
  /** Остаток лимита из заголовка Api-Point-Balance (или -1, если отсутствует). */
  apiPointBalance: number;
}

/** Тело ошибки API. */
interface ApiErrorBody {
  code?: string;
  message?: string;
}

/** Комбинирует пользовательский сигнал и таймаут в один AbortSignal. */
function withTimeout(
  timeoutMs: number,
  userSignal?: AbortSignal,
): { signal: AbortSignal; cleanup: () => void; timedOut: () => boolean } {
  const controller = new AbortController();
  let timedOut = false;

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const onUserAbort = () => controller.abort();
  if (userSignal) {
    if (userSignal.aborted) {
      controller.abort();
    } else {
      userSignal.addEventListener('abort', onUserAbort, { once: true });
    }
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timer);
      userSignal?.removeEventListener('abort', onUserAbort);
    },
    timedOut: () => timedOut,
  };
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export class HttpTransport {
  private readonly base: string;

  constructor(
    private readonly config: ResolvedConfig,
    private readonly tokenProvider: TokenProvider,
    private readonly fetchImpl: FetchLike,
  ) {
    this.base = baseUri(config);
  }

  /**
   * Выполняет запрос и разбирает ответ.
   *
   * @param method HTTP-метод.
   * @param path путь относительно базового URI (без ведущего слэша).
   * @param body тело запроса (будет сериализовано в JSON) либо undefined.
   * @param signal пользовательский AbortSignal для отмены.
   */
  async request<T>(
    method: string,
    path: string,
    body?: unknown,
    signal?: AbortSignal,
  ): Promise<ApiResponse<T>> {
    const url = this.base + path.replace(/^\/+/, '');
    const payload = body === undefined ? undefined : JSON.stringify(body);

    let attempt = 0;
    let tokenRefreshed = false;

    for (;;) {
      const token = await this.tokenProvider.getToken(signal);
      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'User-Agent': this.config.userAgent,
      };
      if (payload !== undefined) {
        headers['Content-Type'] = 'application/json';
      }

      const timeout = withTimeout(this.config.timeoutMs, signal);
      let response;
      try {
        response = await this.fetchImpl(url, {
          method,
          headers,
          body: payload,
          signal: timeout.signal,
        });
      } catch (err) {
        timeout.cleanup();
        // Отмена пользователем — не повторяем.
        if (signal?.aborted) {
          throw new NetworkError('Запрос отменён.', err);
        }
        // Таймаут или сетевая ошибка — повторяем в пределах бюджета.
        if (attempt < this.config.maxRetries) {
          attempt++;
          await this.wait(attempt, 0);
          continue;
        }
        const reason = timeout.timedOut() ? 'таймаут' : 'сетевая ошибка';
        throw new NetworkError(`Запрос ${method} ${path} не выполнен: ${reason}.`, err);
      }
      timeout.cleanup();

      const status = response.status;
      const text = await response.text();

      // 401 — однократно обновляем токен и повторяем без задержки.
      if (status === 401 && !tokenRefreshed) {
        tokenRefreshed = true;
        await this.tokenProvider.forgetToken();
        continue;
      }

      // 429 и 5xx — повторяем в пределах бюджета попыток.
      if ((status === 429 || status >= 500) && attempt < this.config.maxRetries) {
        attempt++;
        await this.wait(attempt, retryAfterSeconds(response));
        continue;
      }

      if (status >= 400) {
        throw buildApiError(status, text, retryAfterSeconds(response));
      }

      return {
        data: parseBody<T>(text),
        apiPointBalance: pointBalance(response),
      };
    }
  }

  private async wait(attempt: number, retryAfter: number): Promise<void> {
    const delayMs =
      retryAfter > 0 ? retryAfter * 1000 : this.config.retryBaseDelayMs * 2 ** (attempt - 1);
    if (delayMs > 0) {
      await sleep(delayMs);
    }
  }
}

function retryAfterSeconds(response: { headers: { get(name: string): string | null } }): number {
  const value = response.headers.get('Retry-After');
  if (!value) return 0;
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) || n < 0 ? 0 : n;
}

function pointBalance(response: { headers: { get(name: string): string | null } }): number {
  const value = response.headers.get('Api-Point-Balance');
  if (!value) return -1;
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? -1 : n;
}

function parseBody<T>(text: string): T {
  if (!text) {
    return {} as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
}

function buildApiError(status: number, text: string, retryAfter: number): AvitoApiError {
  let parsed: ApiErrorBody = {};
  try {
    parsed = JSON.parse(text) as ApiErrorBody;
  } catch {
    // тело не JSON — оставляем пустым
  }
  const message = parsed.message || `Ошибка API (HTTP ${status}).`;
  return createApiError(status, message, parsed.code, retryAfter > 0 ? retryAfter : undefined);
}
