/**
 * Типы моделей ответов API.
 *
 * Имена полей соответствуют JSON-ответам API (включая особенности регистра,
 * например `accountID` против `accountId`).
 */

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

/** Баланс аккаунта (рубли и бонусы, целые числа). */
export interface Balance {
  balance: number;
  bonusBalance: number;
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
  legalType?: string;
  legalRole?: string;
  accountId?: number;
}

/** Договор. */
export interface Contract {
  id?: number;
  accountID?: number;
  client?: Advertiser;
  contractor?: Advertiser;
  type?: string;
  date?: string;
  number?: string;
  subject?: string;
  object?: string;
  cid?: string;
  description?: string;
  parentId?: number;
}

/** Рекламная кампания. */
export interface Campaign {
  id?: number;
  name?: string;
  status?: string;
  budget?: number;
  paymentModel?: string;
  campaignType?: string;
  startDate?: string;
  endDate?: string;
  userId?: number;
  accountId?: number;
  advertiserId?: number;
  contractId?: number;
  managerID?: number;
  additionalAgreementID?: number;
  createdAt?: string;
  updatedAt?: string;
}

/** Группа объявлений. */
export interface Group {
  id?: number;
  name?: string;
  accountID?: number;
  campaignID?: number;
  status?: string;
  budget?: number;
  price?: number;
  paymentModel?: string;
  campaignType?: string;
  advertiserID?: number;
  managerID?: number;
  haveCreative?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** Креатив. */
export interface Creative {
  id?: number;
  name?: string;
  title?: string;
  description?: string;
  buttonText?: string;
  link?: string;
  status?: string;
  groupID?: number;
  campaignID?: number;
  accountID?: number;
  advertiserID?: number;
  managerID?: number;
  paymentModel?: string;
  campaignType?: string;
  legalInfo?: Record<string, unknown>;
}

/** Пользователь аккаунта. */
export interface User {
  id?: number;
  role?: string;
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

/** Результат создания тестового аккаунта (песочница). */
export interface CreatedAccount {
  accountID: number;
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
  spend?: number;
  spendBonus?: number;
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

/** Статистика по сущности (кампании, группе или креативе). */
export interface EntityStatistic {
  id?: number;
  name?: string;
  groupId?: number;
  paymentModel?: string;
  campaignType?: string;
  data?: StatsData[];
  totalData?: StatsData;
}

/** Статистика по кампании со сводками по группам и креативам. */
export interface CampaignStatisticResult {
  campaign?: EntityStatistic;
  groups?: EntityStatistic[];
  creatives?: EntityStatistic[];
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
  actualAddress: string;
  contact: Record<string, unknown>;
  kpp?: string;
  legalType?: string;
}
