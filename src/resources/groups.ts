/** Ресурс групп объявлений. */

import { ValidationError } from '../errors.js';
import { iteratePages, type ListRequest, type PaginatedResult } from '../pagination.js';
import type { Group } from '../types.js';
import { BaseResource } from './base.js';

export class GroupResource extends BaseResource {
  /** Список групп (POST v1/account/{accountID}/groups). */
  list(req: ListRequest = {}, signal?: AbortSignal): Promise<PaginatedResult<Group>> {
    return this.listResource<Group>(this.accountPath('groups'), 'groups', req, signal);
  }

  /** Перебор всех групп по всем страницам. */
  iterate(req: ListRequest = {}, signal?: AbortSignal): AsyncGenerator<Group, void, undefined> {
    return iteratePages<Group>(req, (r) => this.list(r, signal));
  }

  /**
   * Изменить бюджет группы (только ручное управление ставкой; значение >= 1).
   *
   * POST v1/account/{accountID}/group/{groupID}/change-budget
   *
   * @throws ConflictError (HTTP 409), если изменение недоступно в текущем состоянии группы.
   */
  async changeBudget(groupId: number, budget: number, signal?: AbortSignal): Promise<void> {
    if (budget < 1) {
      throw new ValidationError(`Бюджет должен быть не менее 1, передано ${budget}.`);
    }
    await this.http.request(
      'POST',
      this.accountPath(`group/${groupId}/change-budget`),
      { budget },
      signal,
    );
  }

  /**
   * Изменить ставку группы (только ручное управление ставкой; значение >= 1).
   *
   * POST v1/account/{accountID}/group/{groupID}/change-price
   *
   * @throws ConflictError (HTTP 409), если изменение недоступно в текущем состоянии группы.
   */
  async changePrice(groupId: number, price: number, signal?: AbortSignal): Promise<void> {
    if (price < 1) {
      throw new ValidationError(`Ставка должна быть не менее 1, передано ${price}.`);
    }
    await this.http.request(
      'POST',
      this.accountPath(`group/${groupId}/change-price`),
      { price },
      signal,
    );
  }
}
