/**
 * Поддельная реализация fetch для детерминированных тестов (без сети).
 *
 * Запросы записываются, а ответы выдаются из заранее заданной очереди по ключу
 * `METHOD path`. Это аналог `responses`/`httptest` из других SDK серии.
 */

import type { FetchLike, FetchResponseLike } from '../src/config.js';

export interface RecordedRequest {
  method: string;
  url: string;
  path: string;
  authorization?: string;
  userAgent?: string;
  headers: Record<string, string>;
  body?: string;
}

interface QueuedResponse {
  status: number;
  body: unknown;
  headers?: Record<string, string>;
}

function makeResponse(queued: QueuedResponse): FetchResponseLike {
  const headers = queued.headers ?? {};
  const text = typeof queued.body === 'string' ? queued.body : JSON.stringify(queued.body);
  return {
    status: queued.status,
    headers: {
      get(name: string): string | null {
        const key = Object.keys(headers).find((h) => h.toLowerCase() === name.toLowerCase());
        return key ? headers[key]! : null;
      },
    },
    text: () => Promise.resolve(text),
  };
}

export class FakeFetch {
  readonly requests: RecordedRequest[] = [];
  private readonly queues = new Map<string, QueuedResponse[]>();

  /** Добавляет ответ в очередь маршрута. Ответы выдаются по порядку. */
  enqueue(method: string, path: string, response: QueuedResponse): this {
    const key = `${method.toUpperCase()} ${path}`;
    const list = this.queues.get(key) ?? [];
    list.push(response);
    this.queues.set(key, list);
    return this;
  }

  /** Удобный помощник: успешный JSON-ответ. */
  enqueueJson(method: string, path: string, body: unknown, headers?: Record<string, string>): this {
    return this.enqueue(method, path, { status: 200, body, headers: headers ?? {} });
  }

  /** Очередь для эндпоинта токена. */
  enqueueToken(token = 'test-token'): this {
    return this.enqueue('POST', '/token', {
      status: 200,
      body: { access_token: token, expires_in: 86400, token_type: 'Bearer' },
    });
  }

  /** Реализация fetch, совместимая с {@link FetchLike}. */
  get fetch(): FetchLike {
    return (input, init) => {
      const method = (init?.method ?? 'GET').toUpperCase();
      const url = input;
      const path = new URL(url).pathname;
      this.requests.push({
        method,
        url,
        path,
        authorization: init?.headers?.['Authorization'],
        userAgent: init?.headers?.['User-Agent'],
        headers: { ...(init?.headers ?? {}) },
        body: init?.body,
      });
      const key = `${method} ${path}`;
      const queue = this.queues.get(key);
      if (!queue || queue.length === 0) {
        return Promise.resolve(
          makeResponse({
            status: 404,
            body: { code: 'no_handler', message: `нет ответа для ${key}` },
          }),
        );
      }
      const next = queue.length > 1 ? queue.shift()! : queue[0]!;
      return Promise.resolve(makeResponse(next));
    };
  }

  /** Последний записанный запрос. */
  lastRequest(): RecordedRequest {
    const last = this.requests[this.requests.length - 1];
    if (!last) throw new Error('запросов не было');
    return last;
  }
}
