/**
 * Иерархия ошибок SDK Авито Реклама.
 *
 * Все ошибки наследуются от {@link AvitoAdsError}, что позволяет перехватывать
 * любую ошибку библиотеки одним `catch`. Ошибки HTTP-уровня наследуются от
 * {@link AvitoApiError} и несут код состояния, код ошибки API и сообщение.
 */

/** Базовая ошибка SDK. */
export class AvitoAdsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
    // Корректная цепочка прототипов при компиляции в ES5/ES2015.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Некорректная конфигурация клиента. */
export class ConfigurationError extends AvitoAdsError {}

/** Ошибка валидации входных данных на стороне клиента (до запроса к API). */
export class ValidationError extends AvitoAdsError {}

/** Параметры конструктора {@link AvitoApiError}. */
export interface AvitoApiErrorOptions {
  statusCode: number;
  code?: string;
  retryAfter?: number;
}

/** Базовая ошибка ответа API. */
export class AvitoApiError extends AvitoAdsError {
  /** HTTP-код ответа. */
  readonly statusCode: number;
  /** Код ошибки из тела ответа (поле `code`), если есть. */
  readonly code?: string;
  /** Значение заголовка `Retry-After` в секундах (для 429), если есть. */
  readonly retryAfter?: number;

  constructor(message: string, options: AvitoApiErrorOptions) {
    super(message);
    this.statusCode = options.statusCode;
    this.code = options.code;
    this.retryAfter = options.retryAfter;
  }
}

/** HTTP 400 — некорректный запрос. */
export class BadRequestError extends AvitoApiError {}

/** HTTP 401 — ошибка аутентификации. */
export class AuthenticationError extends AvitoApiError {}

/** HTTP 403 — доступ запрещён. */
export class AccessDeniedError extends AvitoApiError {}

/** HTTP 404 — ресурс не найден. */
export class NotFoundError extends AvitoApiError {}

/**
 * HTTP 409 — конфликт состояния. Возвращают изменение бюджета и ставки группы
 * (`groups.changeBudget`, `groups.changePrice`), когда изменение недоступно в
 * текущем состоянии группы. Наследует {@link AvitoApiError}, поэтому прежние
 * обработчики по базовому классу продолжают его ловить.
 */
export class ConflictError extends AvitoApiError {}

/** HTTP 429 — превышен лимит запросов. */
export class RateLimitError extends AvitoApiError {}

/** HTTP 5xx — ошибка на стороне сервера. */
export class ServerError extends AvitoApiError {}

/** Сетевая ошибка или таймаут соединения. */
export class NetworkError extends AvitoAdsError {
  /** Исходная ошибка, если есть. */
  readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = cause;
  }
}

/**
 * Создаёт подходящий подкласс {@link AvitoApiError} по HTTP-статусу.
 */
export function createApiError(
  status: number,
  message: string,
  code?: string,
  retryAfter?: number,
): AvitoApiError {
  const options: AvitoApiErrorOptions = { statusCode: status, code, retryAfter };
  switch (status) {
    case 400:
      return new BadRequestError(message, options);
    case 401:
      return new AuthenticationError(message, options);
    case 403:
      return new AccessDeniedError(message, options);
    case 404:
      return new NotFoundError(message, options);
    case 409:
      return new ConflictError(message, options);
    case 429:
      return new RateLimitError(message, options);
    default:
      if (status >= 500) {
        return new ServerError(message, options);
      }
      return new AvitoApiError(message, options);
  }
}

/** Сообщает, что ошибка — это превышение лимита запросов (HTTP 429). */
export function isRateLimitError(err: unknown): err is RateLimitError {
  return err instanceof RateLimitError;
}

/** Сообщает, что ошибка — это «не найдено» (HTTP 404). */
export function isNotFoundError(err: unknown): err is NotFoundError {
  return err instanceof NotFoundError;
}

/** Сообщает, что ошибка — это конфликт состояния (HTTP 409). */
export function isConflictError(err: unknown): err is ConflictError {
  return err instanceof ConflictError;
}

/** Сообщает, что ошибка — это ошибка сервера (HTTP 5xx). */
export function isServerError(err: unknown): err is ServerError {
  return err instanceof ServerError;
}
