import { describe, it, expect } from 'vitest';
import {
  AvitoAdsClient,
  ConversionGoalType,
  ValidationError,
  type Conversions,
  type FetchLike,
  type StatsData,
} from '../src/index.js';
import { FakeFetch } from './fake-fetch.js';

const ACCT = '/ads/v1/account/123456789';
const FROM = '2026-11-01';
const TO = '2026-11-10';

function makeClient(fake: FakeFetch, fetch: FetchLike = fake.fetch): AvitoAdsClient {
  return new AvitoAdsClient({
    clientId: 'cid',
    clientSecret: 'secret',
    accountId: 123456789,
    fetch,
    retryBaseDelayMs: 0,
    maxRetries: 0,
  });
}

const lastBody = (fake: FakeFetch): unknown => JSON.parse(fake.lastRequest().body ?? '{}');

describe('Конверсии в статистике (swagger 1.5.1)', () => {
  it('click-in: контакты, подписки, CPA и CR; null и отсутствие не равны нулю', async () => {
    const fake = new FakeFetch();
    fake.enqueueToken();
    fake.enqueueJson('POST', `${ACCT}/campaigns/555/stats`, {
      campaign: {
        id: 555,
        data: [
          {
            conversions: {
              contacts: {
                totalCount: 5,
                webCount: 2,
                mavCount: 1,
                androidCount: 1,
                iosCount: 1,
                cr: 0.05,
              },
              cpaKopeks: 0,
              goalType: 'contacts',
              cr: 0.05,
            },
          },
        ],
        totalData: { conversions: null },
      },
      groups: [],
      creatives: [{ id: 2, data: [], totalData: {} }],
    });

    const result = await makeClient(fake).statistics.campaign(555, FROM, TO, {
      includeConversions: true,
    });
    expect(lastBody(fake)).toEqual({ dateFrom: FROM, dateTo: TO, includeConversions: true });

    const conversions: Conversions = result.campaign!.data![0]!.conversions!;
    expect(conversions.contacts).toEqual({
      totalCount: 5,
      webCount: 2,
      mavCount: 1,
      androidCount: 1,
      iosCount: 1,
      cr: 0.05,
    });
    expect(conversions.cpaKopeks).toBe(0);
    expect(conversions.goalType).toBe(ConversionGoalType.Contacts);
    expect(conversions.goalHits).toBeUndefined();
    expect(conversions.customGoal).toBeUndefined();
    expect(result.campaign!.totalData!.conversions).toBeNull();
    expect(result.creatives![0]!.totalData!.conversions).toBeUndefined();
  });

  it('click-out: главная цель и её события; неизвестный goalType сохраняется', async () => {
    const fake = new FakeFetch();
    fake.enqueueToken();
    fake.enqueueJson('POST', `${ACCT}/campaigns/555/groups/stats`, {
      groups: [
        {
          id: 1,
          totalData: {
            conversions: {
              goalHits: 10,
              cpaKopeks: 1250,
              goalType: 'customGoal',
              customGoal: { id: 42, name: 'Заявка' },
              cr: 0.05,
            },
          },
        },
        { id: 2, totalData: { conversions: { goalType: 'brand_new' } } },
      ],
    });

    const groups = await makeClient(fake).statistics.groups(555, FROM, TO, [1, 2], {
      includeConversions: true,
    });
    expect(lastBody(fake)).toEqual({
      dateFrom: FROM,
      dateTo: TO,
      groupIDs: [1, 2],
      includeConversions: true,
    });
    const conversions = groups[0]!.totalData!.conversions!;
    expect(conversions.goalHits).toBe(10);
    expect(conversions.goalType).toBe(ConversionGoalType.CustomGoal);
    expect(conversions.customGoal).toEqual({ id: 42, name: 'Заявка' });
    expect(conversions.contacts).toBeUndefined();
    expect(groups[1]!.totalData!.conversions!.goalType).toBe('brand_new');
  });

  it('без includeConversions поле не отправляется; AbortSignal принимается как раньше', async () => {
    const fake = new FakeFetch();
    fake.enqueueToken();
    const stats: StatsData = {};
    for (let i = 0; i < 3; i += 1) {
      fake.enqueueJson('POST', `${ACCT}/campaigns/555/stats`, { campaign: { totalData: stats } });
    }
    fake.enqueueJson('POST', `${ACCT}/campaigns/555/groups/stats`, { groups: [] });
    fake.enqueueJson('POST', `${ACCT}/campaigns/555/creatives/stats`, { creatives: [] });
    const { statistics } = makeClient(fake);
    const { signal } = new AbortController();

    await statistics.campaign(555, FROM, TO);
    expect(lastBody(fake)).toEqual({ dateFrom: FROM, dateTo: TO });
    await statistics.campaign(555, FROM, TO, signal);
    expect(lastBody(fake)).toEqual({ dateFrom: FROM, dateTo: TO });
    await statistics.campaign(555, FROM, TO, { includeConversions: false, signal });
    expect(lastBody(fake)).toEqual({ dateFrom: FROM, dateTo: TO });
    await statistics.groups(555, FROM, TO, [1], signal);
    expect(lastBody(fake)).toEqual({ dateFrom: FROM, dateTo: TO, groupIDs: [1] });
    await statistics.creatives(555, FROM, TO, [1]);
    expect(lastBody(fake)).toEqual({ dateFrom: FROM, dateTo: TO, creativeIDs: [1] });
  });

  it('сигнал отмены доходит до запроса в обеих формах последнего параметра', async () => {
    const fake = new FakeFetch();
    fake.enqueueToken();
    fake.enqueueJson('POST', `${ACCT}/campaigns/555/stats`, { campaign: {} });
    const aborted: Array<boolean | undefined> = [];
    const client = makeClient(fake, (input, init) => {
      if (input.endsWith('/stats')) aborted.push(init?.signal?.aborted);
      return fake.fetch(input, init);
    });
    const controller = new AbortController();
    controller.abort();

    await client.statistics.campaign(555, FROM, TO, controller.signal);
    await client.statistics.campaign(555, FROM, TO, { signal: controller.signal });
    await client.statistics.campaign(555, FROM, TO, { includeConversions: true });
    expect(aborted).toEqual([true, true, false]);
  });
});

describe('Лимит ID в статистике (swagger 1.5.1)', () => {
  const ids = (n: number): number[] => Array.from({ length: n }, (_, i) => i + 1);

  it.each(['groups', 'creatives'] as const)('%s: от 1 до 5000 ID', async (method) => {
    const fake = new FakeFetch();
    fake.enqueueToken();
    fake.enqueueJson('POST', `${ACCT}/campaigns/555/${method}/stats`, { [method]: [] });
    const { statistics } = makeClient(fake);

    await expect(statistics[method](555, FROM, TO, ids(5000))).resolves.toEqual([]);
    for (const n of [0, 5001]) {
      await expect(statistics[method](555, FROM, TO, ids(n))).rejects.toBeInstanceOf(
        ValidationError,
      );
    }
  });
});
