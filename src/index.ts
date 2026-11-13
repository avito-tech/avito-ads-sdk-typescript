/**
 * Публичный API SDK Авито Реклама.
 *
 * @example
 * ```ts
 * import { AvitoAdsClient } from 'avito-ads';
 *
 * const client = new AvitoAdsClient({
 *   clientId: 'CLIENT_ID',
 *   clientSecret: 'CLIENT_SECRET',
 *   accountId: 123456789,
 * });
 * const balance = await client.account.getBalance();
 * ```
 */

export { AvitoAdsClient } from './client.js';
export { API_VERSION, SDK_VERSION, DEFAULT_USER_AGENT } from './version.js';
export {
  optionsFromEnv,
  type AvitoAdsClientOptions,
  type Environment,
  type FetchLike,
  type FetchResponseLike,
} from './config.js';

export { ContractBuilder } from './contract-builder.js';

// Перечисления и их типы.
export {
  LegalType,
  LegalRole,
  UserRole,
  ContractType,
  ContractSubject,
  ContractAction,
  ContractCounterpartyType,
  CampaignPaymentModel,
  CampaignType,
  CampaignStatus,
  GroupStatus,
  CreativeStatus,
  CampaignBudgetFrequency,
  BudgetFrequency,
  FrequencyPeriod,
  GroupFormat,
  AudienceType,
  Paces,
  GroupPriceControl,
  ScheduleType,
  type OpenEnum,
} from './enums.js';

// Ошибки и type-guards.
export {
  AvitoAdsError,
  ConfigurationError,
  ValidationError,
  AvitoApiError,
  BadRequestError,
  AuthenticationError,
  AccessDeniedError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ServerError,
  NetworkError,
  isRateLimitError,
  isNotFoundError,
  isConflictError,
  isServerError,
} from './errors.js';

// Фильтры.
export {
  AdvertisersFilter,
  ContractsFilter,
  CampaignsFilter,
  GroupsFilter,
  CreativesFilter,
  type DateRange,
} from './filters.js';

// Пагинация.
export {
  MAX_LIMIT,
  DEFAULT_LIMIT,
  type ListRequest,
  type PaginatedResult,
  type FilterInput,
} from './pagination.js';

// Хранилище токена.
export { MemoryTokenStorage, type TokenStorage, type StoredToken } from './token.js';

// Типы моделей.
export type {
  Account,
  Balance,
  Advertiser,
  Contract,
  Campaign,
  Group,
  FrequencyRule,
  ActivitySchedule,
  Creative,
  KktuFieldValue,
  StatusReasons,
  User,
  ChildAccount,
  CreatedContract,
  CreatedAdvertiser,
  CreatedAccount,
  CreatedChildAccount,
  StatsData,
  EntityStatistic,
  CampaignStatistic,
  GroupStatistic,
  CreativeStatistic,
  CampaignStatisticResult,
  AdvertiserInput,
  SandboxAccountInput,
} from './types.js';
