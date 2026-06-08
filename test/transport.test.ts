import { describe, it, expect } from 'vitest';
import {
  AccessDeniedError,
  AuthenticationError,
  AvitoAdsClient,
  BadRequestError,
  NotFoundError,
  RateLimitError,
  ServerError,
} from '../src/index.js';
import { FakeFetch } from './fake-fetch.js';

const BALANCE = '/ads/v1/account/123456789/balance';

function makeClient(fake: FakeFetch, maxRetries = 4): AvitoAdsClient {
  return new AvitoAdsClient({
    clientId: 'cid',
    clientSecret: 'secret',
    accountId: 123456789,
    fetch: fake.fetch,
    retryBaseDelayMs: 0,
    maxRetries,
  });
}

describe('HTTP transport', () => {
  it('разбирает тело и Api-Point-Balance, отправляет токен', async () => {
    const fake = new FakeFetch();
    fake.enqueueToken('test-token');
    fake.enqueueJson(
      'GET',
      BALANCE,
      { balance: 15000, bonusBalance: 500 },
      {
        'Api-Point-Balance': '4231',
      },
    );
    const client = makeClient(fake);
    const balance = await client.account.getBalance();
    expect(balance).toEqual({ balance: 15000, bonusBalance: 500 });
    expect(fake.lastRequest().authorization).toBe('Bearer test-token');
  });

  it('отображает коды состояния на типизированные ошибки', async () => {
    const cases: Array<[number, new (...a: any[]) => Error]> = [
      [400, BadRequestError],
      [403, AccessDeniedError],
      [404, NotFoundError],
      [500, ServerError],
    ];
    for (const [status, ErrClass] of cases) {
      const fake = new FakeFetch();
      fake.enqueueToken();
      fake.enqueue('GET', BALANCE, { status, body: { code: 'e', message: 'msg' } });
      const client = makeClient(fake, 0);
      await expect(client.account.getBalance()).rejects.toBeInstanceOf(ErrClass);
    }
  });

  it('переносит code и message в ошибку', async () => {
    const fake = new FakeFetch();
    fake.enqueueToken();
    fake.enqueue('GET', BALANCE, {
      status: 400,
      body: { code: 'bad_request', message: 'Плохой запрос' },
    });
    const client = makeClient(fake, 0);
    await expect(client.account.getBalance()).rejects.toMatchObject({
      statusCode: 400,
      code: 'bad_request',
      message: 'Плохой запрос',
    });
  });

  it('читает Retry-After при 429', async () => {
    const fake = new FakeFetch();
    fake.enqueueToken();
    fake.enqueue('GET', BALANCE, {
      status: 429,
      body: { message: 'too many' },
      headers: { 'Retry-After': '7' },
    });
    const client = makeClient(fake, 0);
    await expect(client.account.getBalance()).rejects.toMatchObject({ retryAfter: 7 });
    await expect(client.account.getBalance()).rejects.toBeInstanceOf(RateLimitError);
  });

  it('обновляет токен и повторяет запрос при 401', async () => {
    const fake = new FakeFetch();
    fake.enqueueToken('tok-1');
    fake.enqueue('GET', BALANCE, { status: 401, body: { message: 'expired' } });
    fake.enqueueToken('tok-2');
    fake.enqueue('GET', BALANCE, { status: 200, body: { balance: 777, bonusBalance: 0 } });
    const client = makeClient(fake);
    const balance = await client.account.getBalance();
    expect(balance.balance).toBe(777);
    expect(fake.lastRequest().authorization).toBe('Bearer tok-2');
  });

  it('постоянный 401 приводит к AuthenticationError', async () => {
    const fake = new FakeFetch();
    fake.enqueueToken('tok-1');
    fake.enqueue('GET', BALANCE, { status: 401, body: { message: 'no' } });
    fake.enqueueToken('tok-2');
    fake.enqueue('GET', BALANCE, { status: 401, body: { message: 'no' } });
    const client = makeClient(fake);
    await expect(client.account.getBalance()).rejects.toBeInstanceOf(AuthenticationError);
  });

  it('повторяет при 429, затем успех', async () => {
    const fake = new FakeFetch();
    fake.enqueueToken();
    fake.enqueue('GET', BALANCE, { status: 429, body: { message: 'slow' } });
    fake.enqueue('GET', BALANCE, { status: 200, body: { balance: 10, bonusBalance: 0 } });
    const client = makeClient(fake);
    expect((await client.account.getBalance()).balance).toBe(10);
  });

  it('повторяет при 503, затем успех', async () => {
    const fake = new FakeFetch();
    fake.enqueueToken();
    fake.enqueue('GET', BALANCE, { status: 503, body: { message: 'down' } });
    fake.enqueue('GET', BALANCE, { status: 200, body: { balance: 11, bonusBalance: 0 } });
    const client = makeClient(fake);
    expect((await client.account.getBalance()).balance).toBe(11);
  });
});
