/** Ресурс договоров. */

import type { ContractBuilder } from '../contract-builder.js';
import { iteratePages, type ListRequest, type PaginatedResult } from '../pagination.js';
import type { Contract, CreatedContract } from '../types.js';
import { BaseResource } from './base.js';

export class ContractResource extends BaseResource {
  /**
   * Создаёт договор (POST v1/account/{accountID}/create-contract).
   *
   * Принимает {@link ContractBuilder} (с проверкой правил по типу) либо готовый
   * словарь тела запроса.
   */
  async create(
    contract: ContractBuilder | Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<CreatedContract> {
    const body =
      typeof (contract as ContractBuilder).build === 'function'
        ? (contract as ContractBuilder).build()
        : (contract as Record<string, unknown>);
    const response = await this.http.request<CreatedContract>(
      'POST',
      this.accountPath('create-contract'),
      body,
      signal,
    );
    return response.data;
  }

  /** Список договоров (POST v1/account/{accountID}/contracts). */
  list(req: ListRequest = {}, signal?: AbortSignal): Promise<PaginatedResult<Contract>> {
    return this.listResource<Contract>(this.accountPath('contracts'), 'contracts', req, signal);
  }

  /** Перебор всех договоров по всем страницам. */
  iterate(req: ListRequest = {}, signal?: AbortSignal): AsyncGenerator<Contract, void, undefined> {
    return iteratePages<Contract>(req, (r) => this.list(r, signal));
  }
}
