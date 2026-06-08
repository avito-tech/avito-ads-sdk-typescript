import { describe, it, expect } from 'vitest';
import { AvitoAdsClient } from '../src/index.js';

/**
 * Интеграционные тесты против реальной песочницы. По умолчанию пропускаются.
 * Запуск:
 *   AVITO_ADS_RUN_INTEGRATION=1 AVITO_ADS_CLIENT_ID=... AVITO_ADS_CLIENT_SECRET=... \
 *   AVITO_ADS_ACCOUNT_ID=... AVITO_ADS_ENVIRONMENT=sandbox npm test
 */
const enabled =
  process.env.AVITO_ADS_RUN_INTEGRATION === '1' &&
  Boolean(process.env.AVITO_ADS_CLIENT_ID) &&
  Boolean(process.env.AVITO_ADS_CLIENT_SECRET) &&
  Boolean(process.env.AVITO_ADS_ACCOUNT_ID);

describe.skipIf(!enabled)('Интеграция с песочницей', () => {
  it('читает баланс', async () => {
    const client = AvitoAdsClient.fromEnv({ environment: 'sandbox' });
    const balance = await client.account.getBalance();
    expect(typeof balance.balance).toBe('number');
  });

  it('получает список кампаний', async () => {
    const client = AvitoAdsClient.fromEnv({ environment: 'sandbox' });
    const page = await client.campaigns.list();
    expect(page.total).toBeGreaterThanOrEqual(0);
  });
});
