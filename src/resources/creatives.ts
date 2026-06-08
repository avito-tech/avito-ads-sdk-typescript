/** Ресурс креативов. */

import { iteratePages, type ListRequest, type PaginatedResult } from '../pagination.js';
import type { Creative } from '../types.js';
import { BaseResource } from './base.js';

export class CreativeResource extends BaseResource {
  /** Список креативов (POST v1/account/{accountID}/creatives). */
  list(req: ListRequest = {}, signal?: AbortSignal): Promise<PaginatedResult<Creative>> {
    return this.listResource<Creative>(this.accountPath('creatives'), 'creatives', req, signal);
  }

  /** Перебор всех креативов по всем страницам. */
  iterate(req: ListRequest = {}, signal?: AbortSignal): AsyncGenerator<Creative, void, undefined> {
    return iteratePages<Creative>(req, (r) => this.list(r, signal));
  }
}
