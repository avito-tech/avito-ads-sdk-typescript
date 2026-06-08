/**
 * Постраничная выборка: параметры запроса, результат страницы и асинхронный обход.
 */

import { ValidationError } from './errors.js';

/** Максимальный размер страницы. */
export const MAX_LIMIT = 100;
/** Размер страницы по умолчанию. */
export const DEFAULT_LIMIT = 20;

/** Фильтр: словарь произвольных полей либо объект-билдер с методом `toMap`. */
export type FilterInput = Record<string, unknown> | { toMap(): Record<string, unknown> };

/** Параметры постраничного запроса. */
export interface ListRequest {
  /** Фильтр. Пустой объект сериализуется в JSON как `{}`. */
  filter?: FilterInput;
  /** Размер страницы (1..100). */
  limit?: number;
  /** Номер страницы (>= 1). */
  page?: number;
}

/** Нормализованные параметры запроса. */
export interface NormalizedListRequest {
  filter: Record<string, unknown>;
  limit: number;
  page: number;
}

function toFilterMap(filter: FilterInput | undefined): Record<string, unknown> {
  if (!filter) return {};
  if (typeof (filter as { toMap?: unknown }).toMap === 'function') {
    return (filter as { toMap(): Record<string, unknown> }).toMap();
  }
  return filter as Record<string, unknown>;
}

/**
 * Проверяет и нормализует параметры запроса.
 *
 * @throws {@link ValidationError} при некорректных limit или page.
 */
export function normalizeListRequest(req: ListRequest = {}): NormalizedListRequest {
  const limit = req.limit ?? DEFAULT_LIMIT;
  const page = req.page ?? 1;
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    throw new ValidationError(`limit должен быть в диапазоне 1..${MAX_LIMIT}, передано ${limit}.`);
  }
  if (!Number.isInteger(page) || page < 1) {
    throw new ValidationError(`page должен быть >= 1, передано ${page}.`);
  }
  return { filter: toFilterMap(req.filter), limit, page };
}

/** Тело постраничного запроса. */
export function listRequestBody(req: NormalizedListRequest): Record<string, unknown> {
  return { filter: req.filter, limit: req.limit, page: req.page };
}

/** Результат одной страницы выборки. */
export interface PaginatedResult<T> {
  /** Общее число элементов по всем страницам. */
  total: number;
  /** Элементы текущей страницы. */
  items: T[];
  /** Номер текущей страницы. */
  page: number;
  /** Размер страницы. */
  limit: number;
  /** Остаток лимита (Api-Point-Balance) или -1, если неизвестен. */
  apiPointBalance: number;
  /** Есть ли ещё страницы. */
  hasNextPage(): boolean;
}

/** Создаёт объект результата страницы с методом hasNextPage. */
export function makePaginatedResult<T>(
  total: number,
  items: T[],
  page: number,
  limit: number,
  apiPointBalance: number,
): PaginatedResult<T> {
  return {
    total,
    items,
    page,
    limit,
    apiPointBalance,
    hasNextPage(): boolean {
      return page * limit < total;
    },
  };
}

/**
 * Перебирает все элементы по всем страницам, подгружая их по мере необходимости.
 *
 * @param req начальный запрос (номер страницы увеличивается автоматически).
 * @param loader функция загрузки одной страницы.
 */
export async function* iteratePages<T>(
  req: ListRequest,
  loader: (req: ListRequest) => Promise<PaginatedResult<T>>,
): AsyncGenerator<T, void, undefined> {
  let page = req.page ?? 1;
  for (;;) {
    const result = await loader({ ...req, page });
    if (result.items.length === 0) {
      return;
    }
    for (const item of result.items) {
      yield item;
    }
    if (!result.hasNextPage()) {
      return;
    }
    page += 1;
  }
}
