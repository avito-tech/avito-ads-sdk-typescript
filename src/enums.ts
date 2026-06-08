/**
 * Перечисления значений API в виде `as const`-объектов и union-типов.
 *
 * Значения можно передавать как через константу (`CampaignStatus.Active`), так и
 * эквивалентной строкой. Для типов используйте одноимённые union-типы.
 */

import { ValidationError } from './errors.js';

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
  Paused: 'paused',
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
  Active: 'active',
  Paused: 'paused',
  Stopped: 'stopped',
  Finished: 'finished',
  Archived: 'archived',
} as const;
export type CreativeStatus = (typeof CreativeStatus)[keyof typeof CreativeStatus];

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

/** Наборы допустимых значений для валидации. */
export const validUserRoles = Object.values(UserRole);
export const validContractTypes = Object.values(ContractType);
export const validContractSubjects = Object.values(ContractSubject);
export const validContractActions = Object.values(ContractAction);
export const validCounterpartyTypes = Object.values(ContractCounterpartyType);
