/** Ресурс дочерних аккаунтов и переводов средств. */

import { ValidationError } from '../errors.js';
import type { ChildAccount, CreatedChildAccount } from '../types.js';
import { BaseResource } from './base.js';

export class ChildAccountResource extends BaseResource {
  /** Список дочерних аккаунтов (GET v1/account/{accountID}/children). */
  async list(signal?: AbortSignal): Promise<ChildAccount[]> {
    return this.listChildren(this.accountPath('children'), signal);
  }

  /**
   * Список дочерних аккаунтов с балансами.
   *
   * GET v1/account/{accountID}/children-with-balances
   */
  async listWithBalances(signal?: AbortSignal): Promise<ChildAccount[]> {
    return this.listChildren(this.accountPath('children-with-balances'), signal);
  }

  private async listChildren(path: string, signal?: AbortSignal): Promise<ChildAccount[]> {
    const response = await this.http.request<{ children?: ChildAccount[] }>(
      'GET',
      path,
      undefined,
      signal,
    );
    return response.data.children ?? [];
  }

  /**
   * Создаёт дочерний аккаунт-непокупатель.
   *
   * POST v1/account/{accountID}/create-nonpayer-child-account
   */
  async createNonpayerChild(
    shortName: string,
    isSelfAdvertisingEnabled: boolean,
    signal?: AbortSignal,
  ): Promise<CreatedChildAccount> {
    const response = await this.http.request<CreatedChildAccount>(
      'POST',
      this.accountPath('create-nonpayer-child-account'),
      { shortName, isSelfAdvertisingEnabled },
      signal,
    );
    return response.data;
  }

  /**
   * Перевод денежных средств (POST v1/account/{accountID}/funds-transfer).
   *
   * @param amount сумма в рублях, не менее 1.
   */
  async transferFunds(accountIdTo: number, amount: number, signal?: AbortSignal): Promise<void> {
    this.assertAmount(amount);
    await this.http.request(
      'POST',
      this.accountPath('funds-transfer'),
      { accountIdTo, amount },
      signal,
    );
  }

  /**
   * Перевод бонусов (POST v1/account/{accountID}/bonus-transfer).
   *
   * @param amount сумма бонусов, не менее 1.
   */
  async transferBonus(accountIdTo: number, amount: number, signal?: AbortSignal): Promise<void> {
    this.assertAmount(amount);
    await this.http.request(
      'POST',
      this.accountPath('bonus-transfer'),
      { accountIdTo, amount },
      signal,
    );
  }

  private assertAmount(amount: number): void {
    if (amount < 1) {
      throw new ValidationError(`Сумма перевода должна быть не менее 1, передано ${amount}.`);
    }
  }
}
