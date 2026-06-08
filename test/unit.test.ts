import { describe, it, expect } from 'vitest';
import {
  AvitoAdsClient,
  CampaignStatus,
  CampaignsFilter,
  ConfigurationError,
  ContractBuilder,
  ContractCounterpartyType,
  ContractSubject,
  CreativesFilter,
  ValidationError,
} from '../src/index.js';
import { normalizeListRequest, listRequestBody, makePaginatedResult } from '../src/pagination.js';

const baseOpts = { clientId: 'id', clientSecret: 'secret', accountId: 123 };

describe('Configuration', () => {
  it('строит базовые адреса', () => {
    const prod = new AvitoAdsClient(baseOpts);
    expect(prod.baseUrl).toBe('https://api.avito.ru/ads/');
    const sandbox = new AvitoAdsClient({ ...baseOpts, environment: 'sandbox' });
    expect(sandbox.baseUrl).toBe('https://api.avito.ru/ads-sandbox/');
  });

  it('отклоняет пустые учётные данные и неположительный accountId', () => {
    expect(() => new AvitoAdsClient({ ...baseOpts, clientId: '' })).toThrow(ConfigurationError);
    expect(() => new AvitoAdsClient({ ...baseOpts, accountId: 0 })).toThrow(ConfigurationError);
  });
});

describe('ListRequest', () => {
  it('пустой фильтр сериализуется как объект {}', () => {
    const norm = normalizeListRequest({});
    const body = JSON.stringify(listRequestBody(norm));
    expect(body).toBe('{"filter":{},"limit":20,"page":1}');
  });

  it('валидирует limit и page', () => {
    expect(() => normalizeListRequest({ limit: 101 })).toThrow(ValidationError);
    expect(() => normalizeListRequest({ limit: 0 })).toThrow(ValidationError);
    expect(() => normalizeListRequest({ page: 0 })).toThrow(ValidationError);
  });
});

describe('PaginatedResult', () => {
  it('hasNextPage учитывает total/page/limit', () => {
    expect(makePaginatedResult(3, [], 1, 2, 100).hasNextPage()).toBe(true);
    expect(makePaginatedResult(3, [], 2, 2, 100).hasNextPage()).toBe(false);
  });
});

describe('Filters', () => {
  it('переименовывает ключи в формат API', () => {
    const m = new CampaignsFilter()
      .statuses([CampaignStatus.Active])
      .contractIds([10, 20])
      .createdAt({ from: '2025-01-01', to: '2025-01-31' })
      .toMap();
    expect(m.contractIDs).toEqual([10, 20]);
    expect(m.createdAt).toEqual({ from: '2025-01-01', to: '2025-01-31' });
    expect(m.statuses).toEqual(['active']);

    const cf = new CreativesFilter().groupIds([5]).campaignIds([7]).toMap();
    expect(cf.groupIDs).toEqual([5]);
    expect(cf.campaignIDs).toEqual([7]);
  });
});

describe('ContractBuilder', () => {
  it('собирает валидный договор на услуги', () => {
    const body = ContractBuilder.service()
      .advertiser(987)
      .counterpartyType(ContractCounterpartyType.DirectWithAdvertiser)
      .subject(ContractSubject.Distribution)
      .reportingRequired(true)
      .date('2025-01-01')
      .number('A-1')
      .intermediary({ inn: '7712345678' })
      .build();
    expect(body.type).toBe('service');
    expect(body.description).toBe('direct_with_advertiser');
  });

  it('применяет правила по типу договора', () => {
    // service без date
    expect(() =>
      ContractBuilder.service()
        .advertiser(1)
        .counterpartyType(ContractCounterpartyType.DirectWithAdvertiser)
        .subject(ContractSubject.Distribution)
        .reportingRequired(true)
        .number('A-1')
        .intermediary({ inn: '1' })
        .build(),
    ).toThrow(ValidationError);

    // external + parentId
    expect(() =>
      ContractBuilder.external('EXT-1')
        .advertiser(1)
        .counterpartyType(ContractCounterpartyType.AdvertiserIntermediary)
        .parentId(5)
        .build(),
    ).toThrow(ValidationError);

    // intermediary без object
    expect(() =>
      ContractBuilder.intermediaryContract()
        .advertiser(1)
        .counterpartyType(ContractCounterpartyType.DirectWithAdvertiser)
        .subject(ContractSubject.Mediation)
        .reportingRequired(true)
        .date('2025-01-01')
        .number('N-1')
        .intermediary({ inn: '1' })
        .build(),
    ).toThrow(ValidationError);

    // parentId + intermediary вместе
    expect(() =>
      ContractBuilder.intermediaryContract()
        .advertiser(1)
        .counterpartyType(ContractCounterpartyType.DirectWithAdvertiser)
        .subject(ContractSubject.Mediation)
        .object('commercial')
        .reportingRequired(true)
        .fundsAllocationToPrincipal(false)
        .date('2025-01-01')
        .number('N-1')
        .parentId(7)
        .intermediary({ inn: '1' })
        .build(),
    ).toThrow(ValidationError);
  });

  it('доп. соглашение (parentId без intermediary) валидно', () => {
    const body = ContractBuilder.intermediaryContract()
      .advertiser(1)
      .counterpartyType(ContractCounterpartyType.DirectWithAdvertiser)
      .subject(ContractSubject.Mediation)
      .object('commercial')
      .reportingRequired(true)
      .fundsAllocationToPrincipal(true)
      .date('2025-03-01')
      .number('DS-1')
      .parentId(100)
      .build();
    expect(body.parentId).toBe(100);
    expect('intermediary' in body).toBe(false);
  });

  it('отклоняет недопустимое значение enum', () => {
    expect(() => ContractBuilder.create().subject('bad-subject')).toThrow(ValidationError);
  });
});
