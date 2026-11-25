/** Ресурс статистики по кампаниям, группам и креативам. */

import { ValidationError } from '../errors.js';
import type { CampaignStatisticResult, CreativeStatistic, GroupStatistic } from '../types.js';
import { BaseResource } from './base.js';

const MAX_PERIOD_DAYS = 100;
const MAX_IDS = 5000;

/** Необязательные параметры запросов статистики кампании и групп. */
export interface StatisticsOptions {
  /**
   * Запросить конверсии (`StatsData.conversions`). По умолчанию `false`. Для
   * креативов API конверсии не возвращает.
   */
  includeConversions?: boolean;
  /** Сигнал отмены запроса. */
  signal?: AbortSignal;
}

export class StatisticsResource extends BaseResource {
  /**
   * Статистика по кампании со сводками по группам и креативам.
   * `options.includeConversions` добавляет конверсии кампании и групп.
   *
   * POST v1/account/{accountID}/campaigns/{campaignID}/stats
   */
  async campaign(
    campaignId: number,
    dateFrom: string,
    dateTo: string,
    options?: StatisticsOptions | AbortSignal,
  ): Promise<CampaignStatisticResult> {
    assertPeriod(dateFrom, dateTo);
    const { includeConversions, signal } = normalizeOptions(options);
    const response = await this.http.request<CampaignStatisticResult>(
      'POST',
      this.accountPath(`campaigns/${campaignId}/stats`),
      { dateFrom, dateTo, ...(includeConversions ? { includeConversions } : {}) },
      signal,
    );
    return response.data;
  }

  /**
   * Статистика по группам кампании (от 1 до 5000 ID).
   * `options.includeConversions` добавляет конверсии групп.
   *
   * POST v1/account/{accountID}/campaigns/{campaignID}/groups/stats
   */
  async groups(
    campaignId: number,
    dateFrom: string,
    dateTo: string,
    groupIds: number[],
    options?: StatisticsOptions | AbortSignal,
  ): Promise<GroupStatistic[]> {
    assertPeriod(dateFrom, dateTo);
    assertIds('groupIds', groupIds);
    const { includeConversions, signal } = normalizeOptions(options);
    const response = await this.http.request<{ groups?: GroupStatistic[] }>(
      'POST',
      this.accountPath(`campaigns/${campaignId}/groups/stats`),
      {
        dateFrom,
        dateTo,
        groupIDs: groupIds,
        ...(includeConversions ? { includeConversions } : {}),
      },
      signal,
    );
    return response.data.groups ?? [];
  }

  /**
   * Статистика по креативам кампании (от 1 до 5000 ID).
   *
   * POST v1/account/{accountID}/campaigns/{campaignID}/creatives/stats
   */
  async creatives(
    campaignId: number,
    dateFrom: string,
    dateTo: string,
    creativeIds: number[],
    signal?: AbortSignal,
  ): Promise<CreativeStatistic[]> {
    assertPeriod(dateFrom, dateTo);
    assertIds('creativeIds', creativeIds);
    const response = await this.http.request<{ creatives?: CreativeStatistic[] }>(
      'POST',
      this.accountPath(`campaigns/${campaignId}/creatives/stats`),
      { dateFrom, dateTo, creativeIDs: creativeIds },
      signal,
    );
    return response.data.creatives ?? [];
  }
}

/** До 1.5.1 последним параметром был `AbortSignal` — он по-прежнему принимается. */
function normalizeOptions(options: StatisticsOptions | AbortSignal = {}): StatisticsOptions {
  return 'aborted' in options ? { signal: options } : options;
}

/** Проверяет число ID в запросе (от 1 до 5000, повторяющиеся учитываются). */
function assertIds(field: string, ids: number[]): void {
  if (ids.length < 1 || ids.length > MAX_IDS) {
    throw new ValidationError(
      `${field} должен содержать от 1 до ${MAX_IDS} ID, передано ${ids.length}.`,
    );
  }
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Проверяет формат дат и длину периода (не более 100 дней). */
function assertPeriod(dateFrom: string, dateTo: string): void {
  if (!DATE_RE.test(dateFrom) || !DATE_RE.test(dateTo)) {
    throw new ValidationError('Даты периода должны быть в формате YYYY-MM-DD.');
  }
  const from = Date.parse(`${dateFrom}T00:00:00Z`);
  const to = Date.parse(`${dateTo}T00:00:00Z`);
  if (Number.isNaN(from) || Number.isNaN(to)) {
    throw new ValidationError('Некорректные даты периода.');
  }
  if (from > to) {
    throw new ValidationError('dateFrom не может быть позже dateTo.');
  }
  const days = Math.round((to - from) / 86_400_000) + 1;
  if (days > MAX_PERIOD_DAYS) {
    throw new ValidationError(
      `Период статистики не может превышать ${MAX_PERIOD_DAYS} дней, запрошено ${days}.`,
    );
  }
}
