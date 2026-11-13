/** Ресурс аккаунта: реквизиты, баланс, создание тестового аккаунта. */

import { ValidationError } from '../errors.js';
import type { Account, Balance, CreatedAccount, SandboxAccountInput } from '../types.js';
import { BaseResource } from './base.js';

export class AccountResource extends BaseResource {
  /** Реквизиты текущего аккаунта (GET v1/account/{accountID}). */
  async get(signal?: AbortSignal): Promise<Account> {
    const response = await this.http.request<{ account?: Account } & Account>(
      'GET',
      this.accountPath(),
      undefined,
      signal,
    );
    // Ответ может приходить как {"account": {...}} либо плоским объектом.
    return response.data.account ?? response.data;
  }

  /** Баланс текущего аккаунта (GET v1/account/{accountID}/balance). */
  async getBalance(signal?: AbortSignal): Promise<Balance> {
    const response = await this.http.request<Balance>(
      'GET',
      this.accountPath('balance'),
      undefined,
      signal,
    );
    return response.data;
  }

  /**
   * Создаёт тестовый аккаунт (только в песочнице).
   *
   * POST v1/account/{accountID}
   *
   * Ответ `207 Multi-Status` (аккаунт создан, тестовые данные подготовлены не
   * полностью) — тоже успех: причины перечислены в `warnings`.
   */
  async createSandboxAccount(
    input: SandboxAccountInput,
    signal?: AbortSignal,
  ): Promise<CreatedAccount> {
    if (!input.contact || Object.keys(input.contact).length === 0) {
      throw new ValidationError('Для создания аккаунта необходимо передать contact.');
    }
    if (!input.legalType) {
      throw new ValidationError('Для создания аккаунта необходимо передать legalType.');
    }
    const response = await this.http.request<CreatedAccount>(
      'POST',
      this.accountPath(),
      input,
      signal,
    );
    // До 2026-06-06 поля warnings в ответе не было: приводим к пустому массиву.
    const warnings = Array.isArray(response.data.warnings) ? response.data.warnings : [];
    return { ...response.data, warnings };
  }
}
