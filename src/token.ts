/**
 * Подсистема токена: хранилище, кэш-ключ и поставщик с обновлением.
 */

import { createHash } from 'node:crypto';
import { AuthenticationError, NetworkError } from './errors.js';
import type { FetchLike, ResolvedConfig } from './config.js';
import { tokenUrl } from './config.js';

/** Запись о токене в хранилище. */
export interface StoredToken {
  token: string;
  /** Абсолютное время истечения (Unix-время в миллисекундах). */
  expiresAt: number;
}

/**
 * Интерфейс хранилища токена.
 *
 * Реализуйте его (например, поверх Redis) и передайте через опцию
 * `tokenStorage`, чтобы переиспользовать токен между перезапусками процесса.
 * Методы могут быть синхронными или возвращать Promise.
 */
export interface TokenStorage {
  get(key: string): StoredToken | undefined | Promise<StoredToken | undefined>;
  set(key: string, value: StoredToken): void | Promise<void>;
  delete(key: string): void | Promise<void>;
}

/** Хранилище токена в памяти процесса (по умолчанию). */
export class MemoryTokenStorage implements TokenStorage {
  private store = new Map<string, StoredToken>();

  get(key: string): StoredToken | undefined {
    return this.store.get(key);
  }

  set(key: string, value: StoredToken): void {
    this.store.set(key, value);
  }

  delete(key: string): void {
    this.store.delete(key);
  }
}

/** Тело ответа эндпоинта /token. */
interface TokenResponse {
  access_token?: string;
  expires_in?: number;
  token_type?: string;
}

/**
 * Поставщик токена: получает, кэширует и обновляет токен OAuth2
 * client_credentials через эндпоинт /token.
 */
export class TokenProvider {
  private readonly cacheKey: string;

  constructor(
    private readonly config: ResolvedConfig,
    private readonly storage: TokenStorage,
    private readonly fetchImpl: FetchLike,
  ) {
    this.cacheKey = TokenProvider.buildCacheKey(config.clientId, config.clientSecret);
  }

  /** Стабильный ключ кэширования, не раскрывающий секрет. */
  static buildCacheKey(clientId: string, clientSecret: string): string {
    const digest = createHash('sha1').update(`${clientId}:${clientSecret}`).digest('hex');
    return `avito_ads_token_${digest}`;
  }

  /** Возвращает действующий токен, обновляя его при необходимости. */
  async getToken(signal?: AbortSignal): Promise<string> {
    const cached = await this.storage.get(this.cacheKey);
    if (cached && !this.isExpired(cached.expiresAt)) {
      return cached.token;
    }
    return this.fetchToken(signal);
  }

  /** Сбрасывает закэшированный токен (например, после ответа 401). */
  async forgetToken(): Promise<void> {
    await this.storage.delete(this.cacheKey);
  }

  private isExpired(expiresAt: number): boolean {
    const leewayMs = this.config.tokenLeewaySeconds * 1000;
    return Date.now() >= expiresAt - leewayMs;
  }

  private async fetchToken(signal?: AbortSignal): Promise<string> {
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    }).toString();

    let response;
    try {
      response = await this.fetchImpl(tokenUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
          'User-Agent': this.config.userAgent,
        },
        body,
        signal,
      });
    } catch (err) {
      throw new NetworkError('Не удалось получить токен: сетевая ошибка.', err);
    }

    const text = await response.text();
    if (response.status !== 200) {
      throw new AuthenticationError(`Не удалось получить токен (HTTP ${response.status}).`, {
        statusCode: response.status,
      });
    }

    let parsed: TokenResponse;
    try {
      parsed = JSON.parse(text) as TokenResponse;
    } catch {
      throw new AuthenticationError('Некорректный JSON в ответе эндпоинта /token.', {
        statusCode: response.status,
      });
    }
    if (!parsed.access_token) {
      throw new AuthenticationError('Ответ эндпоинта /token не содержит access_token.', {
        statusCode: response.status,
      });
    }

    const expiresInSeconds = typeof parsed.expires_in === 'number' ? parsed.expires_in : 86400;
    const expiresAt = Date.now() + expiresInSeconds * 1000;
    await this.storage.set(this.cacheKey, { token: parsed.access_token, expiresAt });
    return parsed.access_token;
  }
}
