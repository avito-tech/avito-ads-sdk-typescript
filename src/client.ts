/**
 * Главная точка входа в SDK Авито Реклама.
 */

import {
  baseUri,
  optionsFromEnv,
  resolveConfig,
  type AvitoAdsClientOptions,
  type ResolvedConfig,
} from './config.js';
import { HttpTransport } from './http/transport.js';
import { MemoryTokenStorage, TokenProvider, type TokenStorage } from './token.js';
import { AccountResource } from './resources/account.js';
import { AdvertiserResource } from './resources/advertisers.js';
import { CampaignResource } from './resources/campaigns.js';
import { ChildAccountResource } from './resources/child-accounts.js';
import { ContractResource } from './resources/contracts.js';
import { CreativeResource } from './resources/creatives.js';
import { GroupResource } from './resources/groups.js';
import { StatisticsResource } from './resources/statistics.js';
import { UserResource } from './resources/users.js';

/**
 * Клиент API Авито Реклама.
 *
 * Все запросы выполняются от лица аккаунта из конфигурации (токен привязан к
 * одному аккаунту). Клиент потокобезопасен и не хранит состояния между
 * запросами (кроме кэша токена) — создавайте его один раз и переиспользуйте.
 *
 * @example
 * ```ts
 * const client = new AvitoAdsClient({
 *   clientId: 'CLIENT_ID',
 *   clientSecret: 'CLIENT_SECRET',
 *   accountId: 123456789,
 *   environment: 'sandbox',
 * });
 * const balance = await client.account.getBalance();
 * ```
 */
export class AvitoAdsClient {
  private readonly config: ResolvedConfig;

  readonly account: AccountResource;
  readonly childAccounts: ChildAccountResource;
  readonly advertisers: AdvertiserResource;
  readonly contracts: ContractResource;
  readonly campaigns: CampaignResource;
  readonly groups: GroupResource;
  readonly creatives: CreativeResource;
  readonly statistics: StatisticsResource;
  readonly users: UserResource;

  constructor(options: AvitoAdsClientOptions) {
    this.config = resolveConfig(options);
    const storage: TokenStorage = this.config.tokenStorage ?? new MemoryTokenStorage();
    const tokenProvider = new TokenProvider(this.config, storage, this.config.fetchImpl);
    const http = new HttpTransport(this.config, tokenProvider, this.config.fetchImpl);
    const accountId = this.config.accountId;

    this.account = new AccountResource(http, accountId);
    this.childAccounts = new ChildAccountResource(http, accountId);
    this.advertisers = new AdvertiserResource(http, accountId);
    this.contracts = new ContractResource(http, accountId);
    this.campaigns = new CampaignResource(http, accountId);
    this.groups = new GroupResource(http, accountId);
    this.creatives = new CreativeResource(http, accountId);
    this.statistics = new StatisticsResource(http, accountId);
    this.users = new UserResource(http, accountId);
  }

  /**
   * Создаёт клиент из переменных окружения (AVITO_ADS_CLIENT_ID и др.).
   *
   * @param overrides дополнительные опции, переопределяющие значения из окружения.
   */
  static fromEnv(overrides: Partial<AvitoAdsClientOptions> = {}): AvitoAdsClient {
    return new AvitoAdsClient({ ...optionsFromEnv(), ...overrides });
  }

  /** Идентификатор аккаунта клиента. */
  get accountId(): number {
    return this.config.accountId;
  }

  /** Базовый адрес API с учётом окружения. */
  get baseUrl(): string {
    return baseUri(this.config);
  }
}
