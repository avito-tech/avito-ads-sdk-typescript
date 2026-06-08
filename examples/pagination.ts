/** Постраничная выборка и автоматический обход всех страниц. */
import { AvitoAdsClient } from '../src/index.js';

async function main(): Promise<void> {
  const client = AvitoAdsClient.fromEnv();

  // Постранично вручную.
  const page = await client.campaigns.list({ limit: 50, page: 1 });
  console.log(`Всего кампаний: ${page.total}, остаток лимита API: ${page.apiPointBalance}`);
  for (const campaign of page.items) {
    console.log(`  - ${campaign.id} ${campaign.name} [${campaign.status}]`);
  }

  // Автоматический обход всех страниц через async-итератор.
  let count = 0;
  for await (const _campaign of client.campaigns.iterate()) {
    count += 1;
  }
  console.log(`Обойдено кампаний: ${count}`);
}

void main();
