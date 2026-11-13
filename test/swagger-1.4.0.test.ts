import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import {
  API_VERSION,
  AvitoAdsClient,
  AvitoApiError,
  BudgetFrequency,
  CampaignBudgetFrequency,
  CampaignStatus,
  ConflictError,
  CreativeStatus,
  DEFAULT_USER_AGENT,
  FrequencyPeriod,
  SDK_VERSION,
  ValidationError,
  isConflictError,
  type Campaign,
  type Group,
  type SandboxAccountInput,
} from '../src/index.js';
import { buildUserAgent } from '../src/version.js';
import { FakeFetch } from './fake-fetch.js';

const ACCT = '/ads/v1/account/123456789';

function makeClient(fake: FakeFetch, userAgent?: string): AvitoAdsClient {
  return new AvitoAdsClient({
    clientId: 'cid',
    clientSecret: 'secret',
    accountId: 123456789,
    fetch: fake.fetch,
    retryBaseDelayMs: 0,
    maxRetries: 0,
    userAgent,
  });
}

const readJson = (path: string): { version?: string; info?: { version?: string } } =>
  JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));

describe('Версия', () => {
  it('SDK_VERSION == API_VERSION == package.json == openapi.json', () => {
    expect(API_VERSION).toBe('1.4.0');
    expect(SDK_VERSION).toBe(API_VERSION);
    expect(readJson('package.json').version).toBe(SDK_VERSION);
    expect(readJson('openapi.json').info?.version).toBe(API_VERSION);
  });
});

describe('User-Agent', () => {
  it('по умолчанию — метка SDK с версией', () => {
    expect(DEFAULT_USER_AGENT).toBe(`avito-ads-sdk-typescript/${SDK_VERSION}`);
    expect(buildUserAgent()).toBe(DEFAULT_USER_AGENT);
    expect(buildUserAgent('  ')).toBe(DEFAULT_USER_AGENT);
  });

  it('пользовательский UA дополняется меткой SDK, а не заменяет её', () => {
    expect(buildUserAgent('my-app/1.0')).toBe(`my-app/1.0 avito-ads-sdk-typescript/${SDK_VERSION}`);
  });

  it('метка не дублируется, если уже есть в пользовательском UA (без учёта регистра)', () => {
    expect(buildUserAgent('my-app/1.0 avito-ads-sdk-typescript/1.4.0')).toBe(
      'my-app/1.0 avito-ads-sdk-typescript/1.4.0',
    );
    expect(buildUserAgent('Avito-Ads-SDK-TypeScript/9.9.9')).toBe('Avito-Ads-SDK-TypeScript/9.9.9');
  });

  it('тот же UA уходит в запрос токена и в запросы к API', async () => {
    const fake = new FakeFetch();
    fake.enqueueToken();
    fake.enqueueJson('GET', `${ACCT}/balance`, { balance: 1, bonusBalance: 0 });
    await makeClient(fake, 'my-app/1.0').account.getBalance();
    const expected = `my-app/1.0 avito-ads-sdk-typescript/${SDK_VERSION}`;
    expect(fake.requests).toHaveLength(2);
    expect(fake.requests[0]!.path).toBe('/token');
    expect(fake.requests[0]!.userAgent).toBe(expected);
    expect(fake.requests[1]!.userAgent).toBe(expected);
  });

  it('без опции userAgent шлёт UA по умолчанию', async () => {
    const fake = new FakeFetch();
    fake.enqueueToken();
    fake.enqueueJson('GET', `${ACCT}/balance`, { balance: 1, bonusBalance: 0 });
    await makeClient(fake).account.getBalance();
    expect(fake.requests.map((r) => r.userAgent)).toEqual([DEFAULT_USER_AGENT, DEFAULT_USER_AGENT]);
  });
});

describe('Неизвестные значения enum в ответах', () => {
  it('неизвестные статус, budgetFrequency и statusReasons разбираются без ошибки', async () => {
    const fake = new FakeFetch();
    fake.enqueueToken();
    fake.enqueueJson('POST', `${ACCT}/campaigns`, {
      total: 1,
      campaigns: [
        {
          id: 1,
          status: 'brand_new_status',
          budgetFrequency: 'hourly',
          statusReasons: ['manual', 'some_future_reason'],
          topStatusReason: 'some_future_reason',
        },
      ],
    });
    fake.enqueueJson('POST', `${ACCT}/groups`, {
      total: 1,
      groups: [
        {
          id: 2,
          status: 'brand_new_status',
          budgetFrequency: 'weekly',
          frequencyRules: [{ count: 3, period: 'fortnight' }],
          statusReasons: ['another_new_reason'],
          topStatusReason: '',
        },
      ],
    });
    const client = makeClient(fake);

    const campaign = (await client.campaigns.list()).items[0]!;
    expect(campaign.status).toBe('brand_new_status');
    expect(campaign.budgetFrequency).toBe('hourly');
    expect(campaign.statusReasons).toEqual(['manual', 'some_future_reason']);
    expect(campaign.topStatusReason).toBe('some_future_reason');

    const group = (await client.groups.list()).items[0]!;
    expect(group.status).toBe('brand_new_status');
    expect(group.budgetFrequency).toBe('weekly');
    expect(group.frequencyRules).toEqual([{ count: 3, period: 'fortnight' }]);
    expect(group.statusReasons).toEqual(['another_new_reason']);
  });

  it('на уровне типов поля ответа принимают и известные, и новые значения', () => {
    const known: Campaign = {
      status: CampaignStatus.PartiallyActive,
      budgetFrequency: CampaignBudgetFrequency.Mixed,
    };
    const unknown: Campaign = { status: 'something_new', budgetFrequency: 'other' };
    const group: Group = {
      budgetFrequency: BudgetFrequency.Daily,
      frequencyRules: [{ count: 1, period: FrequencyPeriod.Week }],
    };
    expect([known.status, unknown.status, group.budgetFrequency]).toEqual([
      'partially_active',
      'something_new',
      'daily',
    ]);
  });

  it('новые статусы кампании и креатива из swagger 1.4.0', () => {
    expect(Object.values(CampaignStatus)).toEqual(
      expect.arrayContaining([
        'will_launch_soon',
        'partially_active',
        'will_stop_soon',
        'pausing',
        'unpausing',
      ]),
    );
    expect(Object.values(CreativeStatus)).toEqual(
      expect.arrayContaining(['will_launch_soon', 'pausing', 'unpausing']),
    );
    expect(Object.values(BudgetFrequency)).not.toContain('weekly');
  });
});

describe('Поля swagger 1.4.0', () => {
  it('nullable budget у mixed-кампании, копейки и прочие поля', async () => {
    const fake = new FakeFetch();
    fake.enqueueToken();
    fake.enqueueJson('POST', `${ACCT}/campaigns`, {
      total: 3,
      campaigns: [
        { id: 1, budgetFrequency: 'mixed', statusReasons: [], topStatusReason: '' },
        { id: 2, budget: null, budgetKopeks: null, budgetFrequency: 'mixed' },
        {
          id: 3,
          budget: 0,
          budgetKopeks: 0,
          budgetFrequency: 'entirePeriod',
          performanceAdditionalAgreementID: 77,
        },
      ],
    });
    const [absent, nulled, empty] = (await makeClient(fake).campaigns.list()).items;
    expect(absent!.budget).toBeUndefined();
    expect(absent!.statusReasons).toEqual([]);
    expect(absent!.topStatusReason).toBe('');
    expect(nulled!.budget).toBeNull();
    expect(nulled!.budgetKopeks).toBeNull();
    expect(empty!.budget).toBe(0);
    expect(empty!.budgetKopeks).toBe(0);
    expect(empty!.performanceAdditionalAgreementID).toBe(77);
  });

  it('группа: frequencyRules, копейки и устаревшие frequencyCount/frequencyPeriod', async () => {
    const fake = new FakeFetch();
    fake.enqueueToken();
    fake.enqueueJson('POST', `${ACCT}/groups`, {
      total: 1,
      groups: [
        {
          id: 5,
          budget: 1000,
          budgetKopeks: 100000,
          price: 25,
          priceKopeks: 2550,
          budgetFrequency: 'daily',
          frequencyRules: [{ count: 3, period: 'day' }],
          frequencyCount: 3,
          frequencyPeriod: 'day',
          startASAP: true,
          targetingLocationIDs: [621540],
        },
      ],
    });
    const group = (await makeClient(fake).groups.list()).items[0]!;
    expect(group.priceKopeks).toBe(2550);
    expect(group.frequencyRules?.[0]).toEqual({ count: 3, period: 'day' });
    // Устаревшие поля сохранены в ответе для совместимости.
    expect([group.frequencyCount, group.frequencyPeriod]).toEqual([3, 'day']);
    expect(group.targetingLocationIDs).toEqual([621540]);
  });

  it('креатив: kktuFields и причины статуса', async () => {
    const fake = new FakeFetch();
    fake.enqueueToken();
    fake.enqueueJson('POST', `${ACCT}/creatives`, {
      total: 1,
      creatives: [
        {
          id: 9,
          status: 'will_launch_soon',
          kktuFields: [{ key: 'kktu', value: '30.10.1' }],
          statusReasons: ['moderation'],
          topStatusReason: 'moderation',
          previewUrl: null,
        },
      ],
    });
    const creative = (await makeClient(fake).creatives.list()).items[0]!;
    expect(creative.status).toBe(CreativeStatus.WillLaunchSoon);
    expect(creative.kktuFields).toEqual([{ key: 'kktu', value: '30.10.1' }]);
    expect(creative.previewUrl).toBeNull();
  });
});

describe('Sandbox: создание аккаунта', () => {
  const input: SandboxAccountInput = {
    inn: '7712345678',
    shortName: 'Тест',
    longName: 'ООО «Тест»',
    ogrn: '1177746123456',
    legalAddress: 'г. Москва',
    legalType: 'ul',
    contact: { name: 'Иван', phone: '+79990000000' },
  };

  it('207 с warnings — успех', async () => {
    const fake = new FakeFetch();
    fake.enqueueToken();
    fake.enqueue('POST', ACCT, {
      status: 207,
      body: { accountID: 42, warnings: ['campaigns were not prepared'] },
    });
    const created = await makeClient(fake).account.createSandboxAccount(input);
    expect(created).toEqual({ accountID: 42, warnings: ['campaigns were not prepared'] });
  });

  it('ответ без warnings приводится к пустому массиву', async () => {
    const fake = new FakeFetch();
    fake.enqueueToken();
    fake.enqueueJson('POST', ACCT, { accountID: 43 });
    const created = await makeClient(fake).account.createSandboxAccount(input);
    expect(created.warnings).toEqual([]);
  });

  it('legalType обязателен', async () => {
    const fake = new FakeFetch();
    fake.enqueueToken();
    const { legalType: _omit, ...withoutLegalType } = input;
    await expect(
      makeClient(fake).account.createSandboxAccount(
        withoutLegalType as unknown as SandboxAccountInput,
      ),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});

describe('409 Conflict', () => {
  it.each([
    ['change-budget', (c: AvitoAdsClient) => c.groups.changeBudget(10, 500)],
    ['change-price', (c: AvitoAdsClient) => c.groups.changePrice(10, 30)],
  ])('%s → ConflictError (наследник AvitoApiError)', async (suffix, call) => {
    const fake = new FakeFetch();
    fake.enqueueToken();
    fake.enqueue('POST', `${ACCT}/group/10/${suffix}`, {
      status: 409,
      body: { code: 'conflict', message: 'Группа в неподходящем статусе' },
    });
    const err = await call(makeClient(fake)).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ConflictError);
    expect(err).toBeInstanceOf(AvitoApiError);
    expect(isConflictError(err)).toBe(true);
    expect(err).toMatchObject({ statusCode: 409, code: 'conflict' });
  });

  it('isConflictError не срабатывает на прочие ошибки', () => {
    expect(isConflictError(new AvitoApiError('x', { statusCode: 400 }))).toBe(false);
    expect(isConflictError(new Error('x'))).toBe(false);
  });
});
