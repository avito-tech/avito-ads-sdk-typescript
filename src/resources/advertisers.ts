/** Ресурс рекламодателей. */

import { iteratePages, type ListRequest, type PaginatedResult } from '../pagination.js';
import type { Advertiser, AdvertiserInput, CreatedAdvertiser } from '../types.js';
import { BaseResource } from './base.js';

export class AdvertiserResource extends BaseResource {
  /** Создаёт рекламодателя (POST v1/account/{accountID}/create-advertiser). */
  async create(input: AdvertiserInput, signal?: AbortSignal): Promise<CreatedAdvertiser> {
    const response = await this.http.request<CreatedAdvertiser>(
      'POST',
      this.accountPath('create-advertiser'),
      input,
      signal,
    );
    return response.data;
  }

  /** Список рекламодателей (POST v1/account/{accountID}/advertisers). */
  list(req: ListRequest = {}, signal?: AbortSignal): Promise<PaginatedResult<Advertiser>> {
    return this.listResource<Advertiser>(
      this.accountPath('advertisers'),
      'advertisers',
      req,
      signal,
    );
  }

  /** Перебор всех рекламодателей по всем страницам. */
  iterate(
    req: ListRequest = {},
    signal?: AbortSignal,
  ): AsyncGenerator<Advertiser, void, undefined> {
    return iteratePages<Advertiser>(req, (r) => this.list(r, signal));
  }
}
