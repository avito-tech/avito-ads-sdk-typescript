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
   */
  async createSandboxAccount(
    input: SandboxAccountInput,
    signal?: AbortSignal,
  ): Promise<CreatedAccount> {
    if (!input.contact || Object.keys(input.contact).length === 0) {
      throw new ValidationError('Для создания аккаунта необходимо передать contact.');
    }
    const response = await this.http.request<CreatedAccount>(
      'POST',
      this.accountPath(),
      input,
      signal,
    );
    return response.data;
  }
}
