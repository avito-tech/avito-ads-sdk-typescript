/**
 * Базовый класс ресурса: общий доступ к транспорту и идентификатору аккаунта.
 */

import type { HttpTransport } from '../http/transport.js';
import {
  listRequestBody,
  makePaginatedResult,
  normalizeListRequest,
  type ListRequest,
  type PaginatedResult,
} from '../pagination.js';

export abstract class BaseResource {
  constructor(
    protected readonly http: HttpTransport,
    protected readonly accountId: number,
  ) {}

  /** Строит путь вида v1/account/{accountID} + необязательный суффикс. */
  protected accountPath(suffix = ''): string {
    const base = `v1/account/${this.accountId}`;
    return suffix ? `${base}/${suffix}` : base;
  }

  /** Выполняет постраничный POST-запрос и собирает типизированный результат. */
  protected async listResource<T>(
    path: string,
    itemsKey: string,
    req: ListRequest,
    signal?: AbortSignal,
  ): Promise<PaginatedResult<T>> {
    const normalized = normalizeListRequest(req);
    const response = await this.http.request<Record<string, unknown>>(
      'POST',
      path,
      listRequestBody(normalized),
      signal,
    );
    const total = typeof response.data.total === 'number' ? response.data.total : 0;
    const rawItems = response.data[itemsKey];
    const items = Array.isArray(rawItems) ? (rawItems as T[]) : [];
    return makePaginatedResult<T>(
      total,
      items,
      normalized.page,
      normalized.limit,
      response.apiPointBalance,
    );
  }
}
