/**
 * Конфигурация клиента и её разрешение в набор внутренних параметров.
 */

import { ConfigurationError } from './errors.js';
import type { TokenStorage } from './token.js';

const API_HOST = 'https://api.avito.ru';
const PRODUCTION_PREFIX = 'ads';
const SANDBOX_PREFIX = 'ads-sandbox';

/** Окружение API. */
export type Environment = 'production' | 'sandbox';

/**
 * Минимальный интерфейс fetch, который требуется SDK. Глобальный `fetch`
 * (Node 18+, браузеры, Deno, Bun) ему соответствует; для тестов или особых
 * рантаймов можно передать свою реализацию через {@link AvitoAdsClientOptions.fetch}.
 */
export type FetchLike = (
  input: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    signal?: AbortSignal;
  },
) => Promise<FetchResponseLike>;

/** Минимальный интерфейс ответа fetch. */
export interface FetchResponseLike {
  readonly status: number;
  readonly headers: { get(name: string): string | null };
  text(): Promise<string>;
}

/** Опции клиента. */
export interface AvitoAdsClientOptions {
  /** Идентификатор приложения (client_id). */
  clientId: string;
  /** Секрет приложения (client_secret). */
  clientSecret: string;
  /** Идентификатор рекламного аккаунта, к которому привязан токен. */
  accountId: number;
  /** Окружение: 'production' (по умолчанию) или 'sandbox'. */
  environment?: Environment;
  /** Таймаут запроса в миллисекундах (по умолчанию 30000). */
  timeoutMs?: number;
  /** Максимальное число повторов при 429/5xx/сетевых ошибках (по умолчанию 4). */
  maxRetries?: number;
  /** Базовая задержка повтора в миллисекундах (по умолчанию 1000). */
  retryBaseDelayMs?: number;
  /** Запас на досрочное обновление токена в секундах (по умолчанию 60). */
  tokenLeewaySeconds?: number;
  /** Своя реализация fetch. По умолчанию — глобальный fetch. */
  fetch?: FetchLike;
  /** Своё хранилище токена. По умолчанию — в памяти процесса. */
  tokenStorage?: TokenStorage;
  /** Значение заголовка User-Agent. */
  userAgent?: string;
}

/** Разрешённая конфигурация со значениями по умолчанию. */
export interface ResolvedConfig {
  clientId: string;
  clientSecret: string;
  accountId: number;
  pathPrefix: string;
  timeoutMs: number;
  maxRetries: number;
  retryBaseDelayMs: number;
  tokenLeewaySeconds: number;
  fetchImpl: FetchLike;
  tokenStorage?: TokenStorage;
  userAgent: string;
}

/**
 * Проверяет опции и заполняет значения по умолчанию.
 *
 * @throws {@link ConfigurationError} при пустых учётных данных, неположительном
 *   accountId или отсутствии fetch в окружении без явной передачи.
 */
export function resolveConfig(options: AvitoAdsClientOptions): ResolvedConfig {
  if (!options.clientId) {
    throw new ConfigurationError('Не задан clientId.');
  }
  if (!options.clientSecret) {
    throw new ConfigurationError('Не задан clientSecret.');
  }
  if (!Number.isInteger(options.accountId) || options.accountId <= 0) {
    throw new ConfigurationError('accountId должен быть положительным целым числом.');
  }

  const fetchImpl = options.fetch ?? (globalThis.fetch as FetchLike | undefined);
  if (!fetchImpl) {
    throw new ConfigurationError(
      'В окружении нет глобального fetch. Обновитесь до Node.js 18+ или передайте свою реализацию через опцию fetch.',
    );
  }

  return {
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    accountId: options.accountId,
    pathPrefix: options.environment === 'sandbox' ? SANDBOX_PREFIX : PRODUCTION_PREFIX,
    timeoutMs: options.timeoutMs ?? 30_000,
    maxRetries: options.maxRetries ?? 4,
    retryBaseDelayMs: options.retryBaseDelayMs ?? 1000,
    tokenLeewaySeconds: options.tokenLeewaySeconds ?? 60,
    fetchImpl,
    tokenStorage: options.tokenStorage,
    userAgent: options.userAgent ?? 'avito-ads-typescript/0.1.0',
  };
}

/** Базовый адрес API с учётом окружения. */
export function baseUri(config: ResolvedConfig): string {
  return `${API_HOST}/${config.pathPrefix}/`;
}

/** Адрес эндпоинта получения токена (общий для prod и sandbox). */
export function tokenUrl(): string {
  return `${API_HOST}/token`;
}

/**
 * Собирает опции из переменных окружения (с префиксом AVITO_ADS_).
 *
 * @throws {@link ConfigurationError} при отсутствии обязательных переменных.
 */
export function optionsFromEnv(
  env: Record<string, string | undefined> = process.env,
): AvitoAdsClientOptions {
  const clientId = env.AVITO_ADS_CLIENT_ID;
  const clientSecret = env.AVITO_ADS_CLIENT_SECRET;
  const accountRaw = env.AVITO_ADS_ACCOUNT_ID;
  if (!clientId || !clientSecret || !accountRaw) {
    throw new ConfigurationError(
      'Необходимы переменные окружения AVITO_ADS_CLIENT_ID, AVITO_ADS_CLIENT_SECRET, AVITO_ADS_ACCOUNT_ID.',
    );
  }
  const accountId = Number.parseInt(accountRaw, 10);
  if (Number.isNaN(accountId)) {
    throw new ConfigurationError('AVITO_ADS_ACCOUNT_ID должно быть числом.');
  }

  const options: AvitoAdsClientOptions = { clientId, clientSecret, accountId };
  if (env.AVITO_ADS_ENVIRONMENT === 'sandbox') {
    options.environment = 'sandbox';
  }
  if (env.AVITO_ADS_MAX_RETRIES) {
    const n = Number.parseInt(env.AVITO_ADS_MAX_RETRIES, 10);
    if (!Number.isNaN(n)) options.maxRetries = n;
  }
  if (env.AVITO_ADS_TIMEOUT_MS) {
    const n = Number.parseInt(env.AVITO_ADS_TIMEOUT_MS, 10);
    if (!Number.isNaN(n)) options.timeoutMs = n;
  }
  if (env.AVITO_ADS_TOKEN_LEEWAY_SECONDS) {
    const n = Number.parseInt(env.AVITO_ADS_TOKEN_LEEWAY_SECONDS, 10);
    if (!Number.isNaN(n)) options.tokenLeewaySeconds = n;
  }
  return options;
}

export { API_HOST };
