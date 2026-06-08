/** Ресурс рекламных кампаний. */

import { iteratePages, type ListRequest, type PaginatedResult } from '../pagination.js';
import type { Campaign } from '../types.js';
import { BaseResource } from './base.js';

export class CampaignResource extends BaseResource {
  /** Список кампаний (POST v1/account/{accountID}/campaigns). */
  list(req: ListRequest = {}, signal?: AbortSignal): Promise<PaginatedResult<Campaign>> {
    return this.listResource<Campaign>(this.accountPath('campaigns'), 'campaigns', req, signal);
  }

  /** Перебор всех кампаний по всем страницам. */
  iterate(req: ListRequest = {}, signal?: AbortSignal): AsyncGenerator<Campaign, void, undefined> {
    return iteratePages<Campaign>(req, (r) => this.list(r, signal));
  }
}
