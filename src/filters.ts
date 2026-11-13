/**
 * Билдеры фильтров для постраничных запросов.
 *
 * Каждый билдер собирает словарь с именами полей, которые ожидает API (например,
 * `contractIDs`). В методы `list`/`iterate` можно передавать как билдер, так и
 * обычный объект-словарь.
 */

import type { CampaignStatus, CreativeStatus, GroupStatus, OpenEnum, Paces } from './enums.js';

/** Диапазон дат в формате YYYY-MM-DD. */
export interface DateRange {
  from: string;
  to: string;
}

/** Базовый билдер фильтра. */
abstract class BaseFilter {
  protected data: Record<string, unknown> = {};

  /** Возвращает словарь фильтра с именами полей API. */
  toMap(): Record<string, unknown> {
    return { ...this.data };
  }
}

/** Фильтр рекламодателей. */
export class AdvertisersFilter extends BaseFilter {
  ids(ids: number[]): this {
    this.data.ids = ids;
    return this;
  }
  inns(inns: string[]): this {
    this.data.inns = inns;
    return this;
  }
  roles(roles: string[]): this {
    this.data.roles = roles;
    return this;
  }
}

/** Фильтр договоров. */
export class ContractsFilter extends BaseFilter {
  ids(ids: number[]): this {
    this.data.ids = ids;
    return this;
  }
  numbers(numbers: string[]): this {
    this.data.numbers = numbers;
    return this;
  }
  contractors(ids: number[]): this {
    this.data.contractors = ids;
    return this;
  }
  clients(ids: number[]): this {
    this.data.clients = ids;
    return this;
  }
}

/** Фильтр кампаний. */
export class CampaignsFilter extends BaseFilter {
  ids(ids: number[]): this {
    this.data.ids = ids;
    return this;
  }
  paymentModels(models: string[]): this {
    this.data.paymentModels = models;
    return this;
  }
  campaignTypes(types: string[]): this {
    this.data.campaignTypes = types;
    return this;
  }
  /** Статусы кампании, включая `will_launch_soon`, `partially_active`, `will_stop_soon`, `pausing`, `unpausing`. */
  statuses(statuses: OpenEnum<CampaignStatus>[]): this {
    this.data.statuses = statuses;
    return this;
  }
  managers(ids: number[]): this {
    this.data.managers = ids;
    return this;
  }
  advertisers(ids: number[]): this {
    this.data.advertisers = ids;
    return this;
  }
  contractIds(ids: number[]): this {
    this.data.contractIDs = ids;
    return this;
  }
  additionalAgreementIds(ids: number[]): this {
    this.data.additionalAgreementIDs = ids;
    return this;
  }
  createdAt(range: DateRange): this {
    this.data.createdAt = range;
    return this;
  }
  timeFrame(range: DateRange): this {
    this.data.timeFrame = range;
    return this;
  }
}

/** Фильтр групп объявлений. */
export class GroupsFilter extends BaseFilter {
  ids(ids: number[]): this {
    this.data.ids = ids;
    return this;
  }
  campaignIds(ids: number[]): this {
    this.data.campaignIDs = ids;
    return this;
  }
  statuses(statuses: OpenEnum<GroupStatus>[]): this {
    this.data.statuses = statuses;
    return this;
  }
  paces(paces: OpenEnum<Paces>[]): this {
    this.data.paces = paces;
    return this;
  }
  managers(ids: number[]): this {
    this.data.managers = ids;
    return this;
  }
  advertisers(ids: number[]): this {
    this.data.advertisers = ids;
    return this;
  }
  paymentModels(models: string[]): this {
    this.data.paymentModels = models;
    return this;
  }
  timeFrame(range: DateRange): this {
    this.data.timeFrame = range;
    return this;
  }
}

/** Фильтр креативов. */
export class CreativesFilter extends BaseFilter {
  ids(ids: number[]): this {
    this.data.ids = ids;
    return this;
  }
  groupIds(ids: number[]): this {
    this.data.groupIDs = ids;
    return this;
  }
  campaignIds(ids: number[]): this {
    this.data.campaignIDs = ids;
    return this;
  }
  paymentModels(models: string[]): this {
    this.data.paymentModels = models;
    return this;
  }
  campaignTypes(types: string[]): this {
    this.data.campaignTypes = types;
    return this;
  }
  /** Статусы креатива, включая `will_launch_soon`, `pausing`, `unpausing`. */
  statuses(statuses: OpenEnum<CreativeStatus>[]): this {
    this.data.statuses = statuses;
    return this;
  }
  managers(ids: number[]): this {
    this.data.managers = ids;
    return this;
  }
  advertisers(ids: number[]): this {
    this.data.advertisers = ids;
    return this;
  }
  timeFrame(range: DateRange): this {
    this.data.timeFrame = range;
    return this;
  }
}
