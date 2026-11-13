/**
 * Типы моделей ответов API (swagger 1.4.0).
 *
 * Имена полей соответствуют JSON-ответам API (включая особенности регистра,
 * например `accountID` против `accountId`).
 *
 * Поля-перечисления в ответах типизированы как {@link OpenEnum}: неизвестное
 * значение (новый статус, код причины и т. п.) разбирается без ошибки и
 * сохраняется строкой.
 */

import type {
  AudienceType,
  BudgetFrequency,
  CampaignBudgetFrequency,
  CampaignPaymentModel,
  CampaignStatus,
  CampaignType,
  ContractType,
  CreativeStatus,
  FrequencyPeriod,
  GroupFormat,
  GroupPriceControl,
  GroupStatus,
  LegalRole,
  LegalType,
  OpenEnum,
  Paces,
  ScheduleType,
  UserRole,
} from './enums.js';

/** Реквизиты рекламного аккаунта. */
export interface Account {
  inn?: string;
  shortName?: string;
  longName?: string;
  ogrn?: string;
  kpp?: string;
  legalAddress?: string;
  actualAddress?: string;
  contact?: Record<string, unknown>;
  manager?: Record<string, unknown>;
}

/** Баланс аккаунта: целые рубли и точные суммы в копейках. */
export interface Balance {
  /** Баланс в рублях. */
  balance: number;
  /** Бонусный баланс в рублях. */
  bonusBalance: number;
  /** Баланс в копейках. */
  balanceKopeks?: number;
  /** Бонусный баланс в копейках. */
  bonusBalanceKopeks?: number;
}

/** Рекламодатель. */
export interface Advertiser {
  id?: number;
  shortName?: string;
  longName?: string;
  inn?: string;
  ogrn?: string;
  kpp?: string;
  legalAddress?: string;
  actualAddress?: string;
  legalType?: OpenEnum<LegalType>;
  legalRole?: OpenEnum<LegalRole>;
  accountId?: number;
}

/** Договор. */
export interface Contract {
  id?: number;
  accountID?: number;
  client?: Advertiser;
  contractor?: Advertiser;
  type?: OpenEnum<ContractType>;
  date?: string;
  number?: string;
  subject?: string;
  object?: string;
  cid?: string;
  description?: string;
  parentId?: number;
  isAgentActingForPublisher?: boolean | null;
  isCreativeReporter?: boolean | null;
}

/**
 * Коды причин текущего статуса (`statusReasons`). API возвращает `[]`, если
 * причин нет; порядок не отражает приоритет. Возможны новые коды.
 */
export type StatusReasons = string[];

/** Рекламная кампания. */
export interface Campaign {
  id?: number;
  name?: string;
  status?: OpenEnum<CampaignStatus>;
  /** Все коды причин текущего статуса; `[]`, если причин нет. */
  statusReasons?: StatusReasons;
  /** Главная причина статуса; `""`, если не определена (даже при непустом `statusReasons`). */
  topStatusReason?: string;
  /**
   * Сумма бюджетов групп в целых рублях с НДС. `null` или отсутствует у
   * кампаний с `budgetFrequency: 'mixed'`; у пустой кампании — `0`.
   */
  budget?: number | null;
  /** Сумма бюджетов групп в копейках с НДС. Отсутствует или `null` так же, как `budget`. */
  budgetKopeks?: number | null;
  /** Тип агрегата бюджета: `daily`, `entirePeriod` или `mixed`. */
  budgetFrequency?: OpenEnum<CampaignBudgetFrequency>;
  paymentModel?: OpenEnum<CampaignPaymentModel>;
  campaignType?: OpenEnum<CampaignType>;
  startDate?: string;
  endDate?: string;
  userId?: number;
  accountId?: number;
  advertiserId?: number;
  contractId?: number;
  managerID?: number;
  additionalAgreementID?: number;
  /** ID доп. соглашения к исполнительскому договору. */
  performanceAdditionalAgreementID?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

/** Правило частотного ограничения группы. */
export interface FrequencyRule {
  /** Количество показов за период. */
  count: number;
  /** Период: `no_limit`, `day`, `week` или `month`. */
  period: OpenEnum<FrequencyPeriod>;
}

/** Часы активности (0–23) по дням недели. */
export interface ActivitySchedule {
  monday?: number[];
  tuesday?: number[];
  wednesday?: number[];
  thursday?: number[];
  friday?: number[];
  saturday?: number[];
  sunday?: number[];
}

/** Группа объявлений. */
export interface Group {
  id?: number;
  name?: string;
  accountID?: number;
  campaignID?: number;
  userID?: number;
  status?: OpenEnum<GroupStatus>;
  /** Все коды причин текущего статуса; `[]`, если причин нет. */
  statusReasons?: StatusReasons;
  /** Главная причина статуса; `""`, если не определена. */
  topStatusReason?: string;
  /** Доступные действия с группой. */
  actions?: string[];
  /** Бюджет группы в рублях с НДС. */
  budget?: number;
  /** Бюджет группы в копейках с НДС. */
  budgetKopeks?: number;
  /** Частота расходования бюджета: `daily` или `entirePeriod`. */
  budgetFrequency?: OpenEnum<BudgetFrequency>;
  /** Ставка в рублях с НДС. */
  price?: number;
  /** Ставка в копейках с НДС. */
  priceKopeks?: number;
  priceControl?: OpenEnum<GroupPriceControl>;
  paymentModel?: OpenEnum<CampaignPaymentModel>;
  campaignType?: OpenEnum<CampaignType>;
  format?: OpenEnum<GroupFormat>;
  pace?: OpenEnum<Paces>;
  /** Правила частотного ограничения. */
  frequencyRules?: FrequencyRule[];
  /**
   * Частота показов первого правила частотного ограничения.
   *
   * @deprecated Сохранено в ответе для совместимости. Используйте `frequencyRules`.
   */
  frequencyCount?: number;
  /**
   * Период первого правила частотного ограничения.
   *
   * @deprecated Сохранено в ответе для совместимости. Используйте `frequencyRules`.
   */
  frequencyPeriod?: OpenEnum<FrequencyPeriod>;
  scheduleType?: OpenEnum<ScheduleType>;
  activitySchedule?: ActivitySchedule;
  startASAP?: boolean;
  periodStartAt?: string | null;
  periodEndAt?: string | null;
  periodTimezone?: string;
  audienceType?: OpenEnum<AudienceType>;
  targetingAgeIDs?: number[];
  targetingAudienceIDs?: string[];
  targetingFamilyStatusIDs?: number[];
  targetingGenderIDs?: number[];
  targetingIncomeIDs?: number[];
  targetingInterestIDs?: string[];
  targetingLocationIDs?: number[];
  targetingParentStatusIDs?: number[];
  advertiserID?: number;
  managerID?: number;
  haveCreative?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** Значение поля динамической формы ККТУ у креатива. */
export interface KktuFieldValue {
  /** Внутренний ключ поля. */
  key: string;
  /** Значение поля, приведённое к строке. */
  value: string;
}

/** Креатив. */
export interface Creative {
  id?: number;
  name?: string;
  title?: string;
  description?: string;
  buttonText?: string;
  link?: string;
  status?: OpenEnum<CreativeStatus>;
  /** Все коды причин текущего статуса; `[]`, если причин нет. */
  statusReasons?: StatusReasons;
  /** Главная причина статуса; `""`, если не определена. */
  topStatusReason?: string;
  groupID?: number;
  campaignID?: number;
  accountID?: number;
  advertiserID?: number;
  managerID?: number;
  userID?: number;
  landingID?: number | null;
  /** Оригинальная ссылка для аналитики. */
  originUrl?: string | null;
  /** Ссылка на предпросмотр креатива. */
  previewUrl?: string | null;
  paymentModel?: OpenEnum<CampaignPaymentModel>;
  campaignType?: OpenEnum<CampaignType>;
  /** Значения полей ККТУ. */
  kktuFields?: KktuFieldValue[];
  /**
   * Устаревшее представление юридических данных.
   *
   * @deprecated С swagger 1.2.0. Используйте `kktuFields`.
   */
  legalInfo?: Record<string, unknown>;
}

/** Пользователь аккаунта. */
export interface User {
  id?: number;
  role?: OpenEnum<UserRole>;
  hasLoggedIn?: boolean;
}

/** Дочерний аккаунт (данные аккаунта вложены в поле `account`). */
export interface ChildAccount {
  account?: {
    id?: number;
    shortName?: string;
  };
  contract?: Record<string, unknown>;
  balance?: Balance;
}

/** Результат создания договора. */
export interface CreatedContract {
  id: number;
}

/** Результат создания рекламодателя. */
export interface CreatedAdvertiser {
  id: number;
}

/**
 * Результат создания тестового аккаунта (песочница). Ответ `207` (аккаунт
 * создан, тестовые данные подготовлены не полностью) тоже считается успехом.
 */
export interface CreatedAccount {
  accountID: number;
  /** Предупреждения о не выполненных sandbox-операциях; `[]` — аккаунт подготовлен полностью. */
  warnings: string[];
}

/** Результат создания дочернего аккаунта. */
export interface CreatedChildAccount {
  accountID: number;
  clientKey?: string;
  clientSecret?: string;
}

/** Точка статистики (за день или агрегированная). */
export interface StatsData {
  timestamp?: string;
  views?: number;
  clicks?: number;
  ctr?: number;
  /** Потрачено денег в рублях. */
  spend?: number;
  /** Потрачено бонусов в рублях. */
  spendBonus?: number;
  /** Потрачено денег в копейках. */
  spendKopeks?: number;
  /** Потрачено бонусов в копейках. */
  spendBonusKopeks?: number;
  cpm?: number;
  cpc?: number;
  videoViews25?: number;
  videoViews50?: number;
  videoViews75?: number;
  videoViews100?: number;
  q25?: number;
  q50?: number;
  q75?: number;
  vtr?: number;
}

/** Общие поля статистики по сущности (кампании, группе или креативу). */
export interface EntityStatistic {
  id?: number;
  name?: string;
  /** Статистика по дням. */
  data?: StatsData[];
  /** Итог за период. */
  totalData?: StatsData;
}

/** Статистика кампании. */
export interface CampaignStatistic extends EntityStatistic {
  paymentModel?: OpenEnum<CampaignPaymentModel>;
  campaignType?: OpenEnum<CampaignType>;
}

/** Статистика группы. */
export type GroupStatistic = EntityStatistic;

/** Статистика креатива. */
export interface CreativeStatistic extends EntityStatistic {
  /** ID группы креатива. */
  groupId?: number;
}

/** Статистика по кампании со сводками по группам и креативам. */
export interface CampaignStatisticResult {
  campaign?: CampaignStatistic;
  groups?: GroupStatistic[];
  creatives?: CreativeStatistic[];
}

/** Входные данные для создания рекламодателя. */
export interface AdvertiserInput {
  inn: string;
  shortName: string;
  longName: string;
  ogrn: string;
  legalAddress: string;
  actualAddress: string;
  legalRole: string;
  legalType: string;
  kpp?: string;
}

/** Входные данные для создания тестового аккаунта. */
export interface SandboxAccountInput {
  inn: string;
  shortName: string;
  longName: string;
  ogrn: string;
  legalAddress: string;
  /** Тип юрлица: `ul` или `ip` (см. {@link LegalType}). Обязателен. */
  legalType: string;
  /** Контактное лицо: `name` и `phone`. */
  contact: Record<string, unknown>;
  /** Фактический адрес. Если не передан, API использует `legalAddress`. */
  actualAddress?: string | null;
  kpp?: string;
}
