/**
 * Перечисления значений API в виде `as const`-объектов и union-типов.
 *
 * Значения можно передавать как через константу (`CampaignStatus.Active`), так и
 * эквивалентной строкой. Для типов используйте одноимённые union-типы.
 *
 * Политика неизвестных значений: в ответах API поля-перечисления типизированы как
 * {@link OpenEnum} — известные значения плюс любая строка. Новое значение, которое
 * API добавит позже, разбирается без ошибки и сохраняется строкой как есть.
 * Проверка допустимости ({@link assertEnum}) применяется только к входным данным.
 */

import { ValidationError } from './errors.js';

/**
 * «Открытое» перечисление для полей ответа: известные значения `T` (подсказки
 * в IDE) плюс любая другая строка (новые значения API не ломают компиляцию).
 * `string & {}` не даёт TypeScript свернуть union в `string`.
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export type OpenEnum<T extends string> = T | (string & {});

/** Тип юридического лица. */
export const LegalType = {
  UL: 'ul',
  IP: 'ip',
} as const;
export type LegalType = (typeof LegalType)[keyof typeof LegalType];

/** Роль контрагента в системе ОРД. */
export const LegalRole = {
  Advertiser: 'rd',
  Agency: 'ra',
  Distributor: 'rr',
} as const;
export type LegalRole = (typeof LegalRole)[keyof typeof LegalRole];

/** Роль пользователя в аккаунте. */
export const UserRole = {
  Admin: 'admin',
  Viewer: 'viewer',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

/** Тип договора. */
export const ContractType = {
  Service: 'service',
  Intermediary: 'intermediary',
  External: 'external',
} as const;
export type ContractType = (typeof ContractType)[keyof typeof ContractType];

/** Предмет договора. */
export const ContractSubject = {
  OrgDistribution: 'org-distribution',
  Mediation: 'mediation',
  Distribution: 'distribution',
  Representation: 'representation',
  Other: 'other',
} as const;
export type ContractSubject = (typeof ContractSubject)[keyof typeof ContractSubject];

/** Действие по договору (поле `object`). */
export const ContractAction = {
  Distribution: 'distribution',
  Conclude: 'conclude',
  Commercial: 'commercial',
  Other: 'other',
} as const;
export type ContractAction = (typeof ContractAction)[keyof typeof ContractAction];

/** Тип контрагента (поле `description`). */
export const ContractCounterpartyType = {
  DirectWithAdvertiser: 'direct_with_advertiser',
  AdvertiserIntermediary: 'advertiser_intermediary',
} as const;
export type ContractCounterpartyType =
  (typeof ContractCounterpartyType)[keyof typeof ContractCounterpartyType];

/** Модель оплаты кампании. */
export const CampaignPaymentModel = {
  CPM: 'CPM',
  CPC: 'CPC',
} as const;
export type CampaignPaymentModel = (typeof CampaignPaymentModel)[keyof typeof CampaignPaymentModel];

/** Тип кампании. */
export const CampaignType = {
  TextImage: 'textImage',
  HTML: 'HTML',
  Video: 'video',
} as const;
export type CampaignType = (typeof CampaignType)[keyof typeof CampaignType];

/** Статус кампании. */
export const CampaignStatus = {
  Draft: 'draft',
  InModeration: 'in_moderation',
  ModerationFailed: 'moderation_failed',
  PartialModeration: 'partial_moderation',
  Active: 'active',
  WillLaunchSoon: 'will_launch_soon',
  PartiallyActive: 'partially_active',
  WillStopSoon: 'will_stop_soon',
  Pausing: 'pausing',
  Paused: 'paused',
  Unpausing: 'unpausing',
  Stopped: 'stopped',
  Finished: 'finished',
  Archived: 'archived',
} as const;
export type CampaignStatus = (typeof CampaignStatus)[keyof typeof CampaignStatus];

/** Статус группы объявлений. */
export const GroupStatus = {
  Draft: 'draft',
  InModeration: 'in_moderation',
  ModerationFailed: 'moderation_failed',
  WillLaunchSoon: 'will_launch_soon',
  Active: 'active',
  WillStopSoon: 'will_stop_soon',
  Pausing: 'pausing',
  Paused: 'paused',
  Unpausing: 'unpausing',
  Stopped: 'stopped',
  Finished: 'finished',
  Archived: 'archived',
} as const;
export type GroupStatus = (typeof GroupStatus)[keyof typeof GroupStatus];

/** Статус креатива. */
export const CreativeStatus = {
  Draft: 'draft',
  ReadyForModeration: 'ready_for_moderation',
  InModeration: 'in_moderation',
  ModerationFailed: 'moderation_failed',
  ErirRegistration: 'erir_registration',
  WillLaunchSoon: 'will_launch_soon',
  Active: 'active',
  Pausing: 'pausing',
  Paused: 'paused',
  Unpausing: 'unpausing',
  Stopped: 'stopped',
  Finished: 'finished',
  Archived: 'archived',
} as const;
export type CreativeStatus = (typeof CreativeStatus)[keyof typeof CreativeStatus];

/**
 * Тип агрегата бюджета кампании (`Campaign.budgetFrequency`). `mixed` — в
 * кампании есть группы и с дневным бюджетом, и с бюджетом на весь период; у
 * такой кампании `budget`/`budgetKopeks` отсутствуют.
 */
export const CampaignBudgetFrequency = {
  Daily: 'daily',
  EntirePeriod: 'entirePeriod',
  Mixed: 'mixed',
} as const;
export type CampaignBudgetFrequency =
  (typeof CampaignBudgetFrequency)[keyof typeof CampaignBudgetFrequency];

/** Частота расходования бюджета группы (`Group.budgetFrequency`). */
export const BudgetFrequency = {
  Daily: 'daily',
  EntirePeriod: 'entirePeriod',
} as const;
export type BudgetFrequency = (typeof BudgetFrequency)[keyof typeof BudgetFrequency];

/** Период частотного ограничения (`FrequencyRule.period`). */
export const FrequencyPeriod = {
  NoLimit: 'no_limit',
  Day: 'day',
  Week: 'week',
  Month: 'month',
} as const;
export type FrequencyPeriod = (typeof FrequencyPeriod)[keyof typeof FrequencyPeriod];

/** Формат группы объявлений. */
export const GroupFormat = {
  MediaRoot: 'mediaRoot',
  MediaSellerProfile: 'mediaSellerProfile',
  MediaPremium: 'mediaPremium',
  Media: 'media',
  Native: 'native',
  HtmlPremium: 'htmlPremium',
  Html: 'html',
  Video: 'video',
} as const;
export type GroupFormat = (typeof GroupFormat)[keyof typeof GroupFormat];

/** Тип аудитории таргетинга группы. */
export const AudienceType = {
  Basic: 'basic',
  Ready: 'ready',
  Autotargeting: 'autotargeting',
} as const;
export type AudienceType = (typeof AudienceType)[keyof typeof AudienceType];

/** Скорость показов группы (`Group.pace`). */
export const Paces = {
  Asap: 'asap',
  Even: 'even',
} as const;
export type Paces = (typeof Paces)[keyof typeof Paces];

/** Управление ценой группы. */
export const GroupPriceControl = {
  Manual: 'manual',
  Auto: 'auto',
} as const;
export type GroupPriceControl = (typeof GroupPriceControl)[keyof typeof GroupPriceControl];

/** Тип расписания показов группы. */
export const ScheduleType = {
  Always: 'always',
  Weekdays9To20: 'weekdays9To20',
  Custom: 'custom',
} as const;
export type ScheduleType = (typeof ScheduleType)[keyof typeof ScheduleType];

/**
 * Проверяет, что значение входит в набор допустимых; иначе бросает
 * {@link ValidationError}. Возвращает значение для удобной цепочки вызовов.
 */
export function assertEnum<T extends string>(
  value: string,
  allowed: readonly T[],
  fieldName: string,
): T {
  if ((allowed as readonly string[]).includes(value)) {
    return value as T;
  }
  throw new ValidationError(
    `Недопустимое значение '${value}' для ${fieldName}. Допустимые: ${allowed.join(', ')}.`,
  );
}

/** Наборы допустимых значений для валидации входных данных. */
export const validUserRoles = Object.values(UserRole);
export const validContractTypes = Object.values(ContractType);
export const validContractSubjects = Object.values(ContractSubject);
export const validContractActions = Object.values(ContractAction);
export const validCounterpartyTypes = Object.values(ContractCounterpartyType);
