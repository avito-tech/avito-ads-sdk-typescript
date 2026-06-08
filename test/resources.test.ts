import { describe, it, expect } from 'vitest';
import {
  AvitoAdsClient,
  ContractBuilder,
  ContractCounterpartyType,
  ValidationError,
} from '../src/index.js';
import { FakeFetch } from './fake-fetch.js';

const ACCT = '/ads/v1/account/123456789';

function makeClient(fake: FakeFetch): AvitoAdsClient {
  return new AvitoAdsClient({
    clientId: 'cid',
    clientSecret: 'secret',
    accountId: 123456789,
    fetch: fake.fetch,
    retryBaseDelayMs: 0,
  });
}

describe('Resources', () => {
  it('campaigns.list разбирает страницу и шлёт пустой фильтр как {}', async () => {
    const fake = new FakeFetch();
    fake.enqueueToken();
    fake.enqueueJson('POST', `${ACCT}/campaigns`, {
      total: 2,
      campaigns: [
        { id: 1, name: 'Кампания 1', status: 'active' },
        { id: 2, name: 'Кампания 2', status: 'paused' },
      ],
    });
    const client = makeClient(fake);
    const page = await client.campaigns.list();
    expect(page.total).toBe(2);
    expect(page.items).toHaveLength(2);
    expect(page.items[0]!.name).toBe('Кампания 1');

    const last = fake.lastRequest();
    expect(last.method).toBe('POST');
    expect(last.path).toBe(`${ACCT}/campaigns`);
    expect(JSON.parse(last.body!)).toEqual({ filter: {}, limit: 20, page: 1 });
  });

  it('campaigns.iterate обходит все страницы', async () => {
    const fake = new FakeFetch();
    fake.enqueueToken();
    fake.enqueue('POST', `${ACCT}/campaigns`, {
      status: 200,
      body: {
        total: 3,
        campaigns: [
          { id: 1, name: 'a' },
          { id: 2, name: 'b' },
        ],
      },
    });
    fake.enqueue('POST', `${ACCT}/campaigns`, {
      status: 200,
      body: { total: 3, campaigns: [{ id: 3, name: 'c' }] },
    });
    const client = makeClient(fake);
    const names: string[] = [];
    for await (const c of client.campaigns.iterate({ limit: 2 })) {
      names.push(c.name!);
    }
    expect(names).toEqual(['a', 'b', 'c']);
  });

  it('groups.changeBudget отклоняет значение меньше 1', async () => {
    const fake = new FakeFetch();
    fake.enqueueToken();
    const client = makeClient(fake);
    await expect(client.groups.changeBudget(10, 0)).rejects.toBeInstanceOf(ValidationError);
  });

  it('childAccounts.transferFunds отклоняет сумму меньше 1 и шлёт корректное тело', async () => {
    const fake = new FakeFetch();
    fake.enqueueToken();
    fake.enqueueJson('POST', `${ACCT}/funds-transfer`, {});
    const client = makeClient(fake);
    await expect(client.childAccounts.transferFunds(999, 0)).rejects.toBeInstanceOf(
      ValidationError,
    );
    await client.childAccounts.transferFunds(987654321, 5000);
    expect(JSON.parse(fake.lastRequest().body!)).toEqual({ accountIdTo: 987654321, amount: 5000 });
  });

  it('statistics.campaign отклоняет период больше 100 дней', async () => {
    const fake = new FakeFetch();
    fake.enqueueToken();
    const client = makeClient(fake);
    await expect(client.statistics.campaign(1, '2025-01-01', '2025-06-01')).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  it('statistics.campaign разбирает ответ и шлёт даты', async () => {
    const fake = new FakeFetch();
    fake.enqueueToken();
    fake.enqueueJson('POST', `${ACCT}/campaigns/1/stats`, {
      campaign: {
        id: 1,
        name: 'Промо',
        data: [{ timestamp: '2025-01-01', views: 100, clicks: 5 }],
        totalData: { views: 100, clicks: 5 },
      },
      groups: [],
      creatives: [],
    });
    const client = makeClient(fake);
    const res = await client.statistics.campaign(1, '2025-01-01', '2025-01-31');
    expect(res.campaign!.name).toBe('Промо');
    expect(res.campaign!.totalData!.views).toBe(100);
    expect(JSON.parse(fake.lastRequest().body!)).toEqual({
      dateFrom: '2025-01-01',
      dateTo: '2025-01-31',
    });
  });

  it('users.list разбирает пользователей', async () => {
    const fake = new FakeFetch();
    fake.enqueueToken();
    fake.enqueueJson('GET', `${ACCT}/users`, {
      total: 1,
      users: [{ id: 42, role: 'admin', hasLoggedIn: true }],
    });
    const client = makeClient(fake);
    const users = await client.users.list();
    expect(users).toHaveLength(1);
    expect(users[0]).toEqual({ id: 42, role: 'admin', hasLoggedIn: true });
  });

  it('users.add отклоняет недопустимую роль', async () => {
    const fake = new FakeFetch();
    fake.enqueueToken();
    const client = makeClient(fake);
    await expect(client.users.add(42, 'superhero')).rejects.toBeInstanceOf(ValidationError);
  });

  it('users.delete использует метод DELETE и корректный путь', async () => {
    const fake = new FakeFetch();
    fake.enqueueToken();
    fake.enqueueJson('DELETE', `${ACCT}/delete-user/42`, {});
    const client = makeClient(fake);
    await client.users.delete(42);
    const last = fake.lastRequest();
    expect(last.method).toBe('DELETE');
    expect(last.path).toBe(`${ACCT}/delete-user/42`);
  });

  it('contracts.create через билдер шлёт собранное тело', async () => {
    const fake = new FakeFetch();
    fake.enqueueToken();
    fake.enqueueJson('POST', `${ACCT}/create-contract`, { id: 555 });
    const client = makeClient(fake);
    const builder = ContractBuilder.external('EXT-1')
      .advertiser(987)
      .counterpartyType(ContractCounterpartyType.AdvertiserIntermediary)
      .intermediary({ inn: '1' });
    const created = await client.contracts.create(builder);
    expect(created.id).toBe(555);
    const body = JSON.parse(fake.lastRequest().body!);
    expect(body.type).toBe('external');
    expect(body.cid).toBe('EXT-1');
  });
});
