/**
 * Быстрый старт: реквизиты и баланс аккаунта.
 *
 * Запуск (после сборки или через tsx):
 *   AVITO_ADS_CLIENT_ID=... AVITO_ADS_CLIENT_SECRET=... AVITO_ADS_ACCOUNT_ID=... \
 *   AVITO_ADS_ENVIRONMENT=sandbox npx tsx examples/quickstart.ts
 */
import { AvitoAdsClient, AvitoApiError } from '../src/index.js';

async function main(): Promise<void> {
  const client = AvitoAdsClient.fromEnv();

  try {
    const account = await client.account.get();
    console.log(`Аккаунт: ${account.shortName} (ИНН ${account.inn})`);

    const balance = await client.account.getBalance();
    console.log(`Баланс: ${balance.balance} ₽, бонусы: ${balance.bonusBalance}`);
  } catch (err) {
    if (err instanceof AvitoApiError) {
      console.error(`Ошибка API ${err.statusCode}: ${err.message}`);
    } else {
      throw err;
    }
  }
}

void main();
