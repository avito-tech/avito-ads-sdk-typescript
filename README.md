# Avito Ads TypeScript SDK

[![CI](https://github.com/avito-tech/avito-ads-sdk-typescript/actions/workflows/ci.yml/badge.svg)](https://github.com/avito-tech/avito-ads-sdk-typescript/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/avito-ads.svg)](https://www.npmjs.com/package/avito-ads)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

TypeScript/JavaScript SDK для API **Авито Реклама** (Avito Ads API).

- [Об Авито Реклама](http://avito.ru/ads)
- [Возможности API Авито Реклама](https://ads-help.avito.com/external/api)
- [Техническая документация API](https://developers.avito.ru/api-catalog/ads/documentation)

Покрывает все основные методы API: аккаунт и баланс, дочерние аккаунты и переводы средств, рекламодателей, договоры, кампании, группы объявлений, креативы, статистику и управление пользователями. Построен на нативном `fetch` — **без рантайм-зависимостей**, поэтому встраивается в бэкенд на Node.js и в любой JS/TS-фреймворк, а также работает в Deno, Bun и serverless/edge-средах.

## Версия

**Версия SDK = версия публичного API (swagger).** SDK `1.4.0` соответствует swagger `1.4.0`
([техническая документация](https://developers.avito.ru/api-catalog/ads/documentation)); копия
спецификации лежит в [`openapi.json`](openapi.json).

```ts
import { API_VERSION, SDK_VERSION } from 'avito-ads';
console.log(API_VERSION, SDK_VERSION); // '1.4.0' '1.4.0'
```

Изменения — в [CHANGELOG](CHANGELOG.md).

## Возможности

- **Без зависимостей** — нативный `fetch` (Node.js 18+, Deno, Bun, edge).
- Полная типизация, поставка ESM + CommonJS и `.d.ts`.
- OAuth2 `client_credentials`: автоматическое получение, кэширование и обновление токена.
- Окружения **production** и **sandbox**.
- Автоповторы при `429`/`5xx` (экспоненциальный backoff, учёт `Retry-After`) и обновление токена при `401`.
- Таймаут и отмена запросов через `AbortSignal`.
- Типизированные ошибки (`instanceof`-классы и type-guards) и чтение `Api-Point-Balance`.
- Постраничная выборка и обход всех страниц через `for await`.

## Установка

```bash
npm install avito-ads
```

Требуется Node.js 18+ (нужен глобальный `fetch`). Для Node 16 передайте свою реализацию `fetch` через опцию.

## Быстрый старт

```ts
import { AvitoAdsClient } from 'avito-ads';

const client = new AvitoAdsClient({
  clientId: 'ВАШ_CLIENT_ID',
  clientSecret: 'ВАШ_CLIENT_SECRET',
  accountId: 123456789, // идентификатор рекламного аккаунта
  environment: 'production', // или 'sandbox'
});

const balance = await client.account.getBalance();
console.log(`Баланс: ${balance.balance} ₽, бонусы: ${balance.bonusBalance}`);
```

CommonJS:

```js
const { AvitoAdsClient } = require('avito-ads');
```

`accountId` задаётся один раз и подставляется во все запросы; токен привязан к этому аккаунту.

### Из переменных окружения

```ts
const client = AvitoAdsClient.fromEnv();
```

Переменные: `AVITO_ADS_CLIENT_ID`, `AVITO_ADS_CLIENT_SECRET`, `AVITO_ADS_ACCOUNT_ID` (обязательные); `AVITO_ADS_ENVIRONMENT` (`production`/`sandbox`), `AVITO_ADS_MAX_RETRIES`, `AVITO_ADS_TIMEOUT_MS`, `AVITO_ADS_TOKEN_LEEWAY_SECONDS` (необязательные).

## Опции клиента

```ts
new AvitoAdsClient({
  clientId,
  clientSecret,
  accountId,
  environment: 'sandbox',
  timeoutMs: 30_000,
  maxRetries: 4,
  retryBaseDelayMs: 1000,
  tokenLeewaySeconds: 60,
  fetch: customFetch, // своя реализация fetch (Node 16, тесты, прокси)
  tokenStorage: myStorage, // своё хранилище токена (например, Redis)
  userAgent: 'my-app/1.0', // дополняется меткой SDK, см. «User-Agent»
});
```

| Окружение                   | Базовый адрес                       |
| --------------------------- | ----------------------------------- |
| `production` (по умолчанию) | `https://api.avito.ru/ads/`         |
| `sandbox`                   | `https://api.avito.ru/ads-sandbox/` |

## Основные операции

```ts
// Аккаунт
const account = await client.account.get();
const balance = await client.account.getBalance();

// Дочерние аккаунты и переводы (сумма >= 1)
const children = await client.childAccounts.list();
await client.childAccounts.transferFunds(987654321, 5000);

// Рекламодатели
import { LegalRole, LegalType } from 'avito-ads';
const created = await client.advertisers.create({
  inn: '7712345678',
  shortName: 'ООО Реклама',
  longName: 'ООО «Реклама»',
  ogrn: '1177746123456',
  legalAddress: '…',
  actualAddress: '…',
  legalRole: LegalRole.Advertiser,
  legalType: LegalType.UL,
  kpp: '771701001',
});

// Группы (только ручная ставка; значение >= 1)
await client.groups.changeBudget(555, 100000);
await client.groups.changePrice(555, 25);

// Статистика (период <= 100 дней, даты YYYY-MM-DD)
const stats = await client.statistics.campaign(555, '2025-01-01', '2025-01-31');
console.log(stats.campaign?.totalData?.views, stats.campaign?.totalData?.clicks);

// Пользователи
import { UserRole } from 'avito-ads';
await client.users.add(42, UserRole.Admin);
await client.users.delete(42);
```

## Статусы, причины и бюджеты

Списки кампаний, групп и креативов возвращают причины текущего статуса: `statusReasons` — все
коды (`[]`, если причин нет), `topStatusReason` — главная причина (`""`, если не определена).
API может добавлять новые коды причин и статусы: поля-перечисления в ответах имеют тип
`OpenEnum<T>` (известные значения плюс любая строка), неизвестное значение приходит строкой без
ошибки.

```ts
import { CampaignStatus } from 'avito-ads';

for await (const campaign of client.campaigns.iterate()) {
  if (campaign.status === CampaignStatus.PartiallyActive) {
    console.log(campaign.name, campaign.topStatusReason, campaign.statusReasons);
  }
}
```

Бюджет кампании — `number | null`. У кампании с `budgetFrequency: 'mixed'` (есть группы и с
дневным бюджетом, и с бюджетом на весь период) `budget` и `budgetKopeks` отсутствуют; у пустой
кампании они равны `0`. Не путайте отсутствие суммы с нулём:

```ts
if (campaign.budget == null) {
  console.log(campaign.name, 'бюджет не агрегируется:', campaign.budgetFrequency); // 'mixed'
} else {
  console.log(campaign.name, campaign.budget, '₽', campaign.budgetKopeks, 'коп.'); // 0 — пустая кампания
}
```

Частотные ограничения группы — в `frequencyRules`; `frequencyCount`/`frequencyPeriod`
устарели и соответствуют первому правилу:

```ts
for await (const group of client.groups.iterate()) {
  for (const rule of group.frequencyRules ?? []) {
    console.log(group.id, `${rule.count} показов за ${rule.period}`); // period: no_limit/day/week/month
  }
}
```

Денежные поля продублированы в копейках: `balanceKopeks`, `bonusBalanceKopeks`, `spendKopeks`,
`spendBonusKopeks`, `budgetKopeks`, `priceKopeks`.

### Песочница: создание тестового аккаунта

Ответ `207 Multi-Status` — успех: аккаунт создан, но тестовые данные подготовлены не полностью.
Причины — в `warnings` (`[]`, если всё готово).

```ts
import { LegalType } from 'avito-ads';

const created = await client.account.createSandboxAccount({
  inn: '7712345678',
  shortName: 'Тест',
  longName: 'ООО «Тест»',
  ogrn: '1177746123456',
  legalAddress: 'г. Москва',
  legalType: LegalType.UL, // обязательное поле
  contact: { name: 'Иван Иванов', phone: '+79990000000' },
});
if (created.warnings.length > 0) {
  console.warn('Аккаунт подготовлен не полностью:', created.warnings);
}
```

## Договоры

`ContractBuilder` проверяет обязательные поля по типу договора ещё до запроса.

```ts
import {
  ContractBuilder,
  ContractCounterpartyType,
  ContractSubject,
  ContractAction,
} from 'avito-ads';

const builder = ContractBuilder.intermediaryContract()
  .advertiser(987654321)
  .counterpartyType(ContractCounterpartyType.DirectWithAdvertiser)
  .subject(ContractSubject.Mediation)
  .object(ContractAction.Commercial)
  .reportingRequired(true)
  .fundsAllocationToPrincipal(false)
  .date('2025-01-15')
  .number('ДА-2025/01')
  .intermediary({
    shortName: 'ООО Реклама',
    inn: '7712345678',
    ogrn: '1177746123456',
    kpp: '771701001',
    legalAddress: '…',
    actualAddress: '…',
    legalType: 'ul',
  });

const created = await client.contracts.create(builder);
```

Также доступны `ContractBuilder.service()` и `ContractBuilder.external('CID')`. Доп. соглашение — через `.parentId(...)` (без `intermediary`).

## Пагинация

```ts
// Постранично
const page = await client.campaigns.list({ limit: 50, page: 1 });
console.log(page.total, page.apiPointBalance, page.hasNextPage());
for (const c of page.items) {
  console.log(c.id, c.name);
}

// Все страницы через async-итератор
for await (const campaign of client.campaigns.iterate()) {
  console.log(campaign.name);
}
```

### Фильтры

```ts
import { CampaignsFilter, CampaignStatus } from 'avito-ads';

const filter = new CampaignsFilter()
  .statuses([CampaignStatus.Active, CampaignStatus.PartiallyActive, CampaignStatus.WillStopSoon])
  .contractIds([10, 20])
  .createdAt({ from: '2025-01-01', to: '2025-01-31' });

const page = await client.campaigns.list({ filter });
```

Пустой фильтр корректно сериализуется в JSON-объект `{}`, как требует API. Фильтры `statuses`
принимают все статусы swagger 1.4.0, включая `will_launch_soon`, `partially_active`,
`will_stop_soon`, `pausing`, `unpausing`.

## Обработка ошибок

```ts
import { AvitoApiError, RateLimitError, NotFoundError } from 'avito-ads';

try {
  await client.account.getBalance();
} catch (err) {
  if (err instanceof RateLimitError) {
    console.log('Повторить через', err.retryAfter, 'сек');
  } else if (err instanceof NotFoundError) {
    // 404
  } else if (err instanceof AvitoApiError) {
    console.log(err.statusCode, err.code, err.message);
  }
}
```

Классы: `BadRequestError`, `AuthenticationError`, `AccessDeniedError`, `NotFoundError`, `ConflictError`, `RateLimitError`, `ServerError` (все наследуют `AvitoApiError`), а также `NetworkError`, `ConfigurationError`, `ValidationError`. Есть type-guards `isRateLimitError`, `isNotFoundError`, `isConflictError`, `isServerError`.

`ConflictError` (HTTP 409) возвращают `groups.changeBudget` и `groups.changePrice`, если
изменение недоступно в текущем состоянии группы:

```ts
import { isConflictError } from 'avito-ads';

try {
  await client.groups.changeBudget(555, 100000);
} catch (err) {
  if (isConflictError(err)) {
    console.log('Бюджет сейчас изменить нельзя:', err.code, err.message);
  } else {
    throw err;
  }
}
```

## User-Agent

По умолчанию SDK отправляет `User-Agent: avito-ads-sdk-typescript/<версия>` (например,
`avito-ads-sdk-typescript/1.4.0`) — и в запросах к API, и в запросе токена. По этой метке API
понимает, что запрос пришёл из SDK.

Опция `userAgent` не заменяет метку, а дополняет её через пробел:

```ts
new AvitoAdsClient({ clientId, clientSecret, accountId, userAgent: 'my-app/1.0' });
// User-Agent: my-app/1.0 avito-ads-sdk-typescript/1.4.0
```

Если значение уже содержит `avito-ads-sdk-typescript/`, метка второй раз не добавляется.

## Таймаут и отмена

Каждый метод принимает необязательный `AbortSignal` последним аргументом:

```ts
const controller = new AbortController();
setTimeout(() => controller.abort(), 5000);
const page = await client.campaigns.list({}, controller.signal);
```

Таймаут на запрос задаётся опцией `timeoutMs`.

## Интеграция во фреймворки

Клиент потокобезопасен и не зависит от фреймворка — создайте его один раз при старте и переиспользуйте. Рабочий пример на `node:http` — в [`examples/http-server.ts`](examples/http-server.ts).

**Express**

```ts
import express from 'express';
import { AvitoAdsClient } from 'avito-ads';

const app = express();
const avito = AvitoAdsClient.fromEnv();

app.get('/balance', async (req, res, next) => {
  try {
    const balance = await avito.account.getBalance();
    res.json({ balance: balance.balance });
  } catch (err) {
    next(err);
  }
});
```

**Fastify**

```ts
import Fastify from 'fastify';
import { AvitoAdsClient } from 'avito-ads';

const app = Fastify();
const avito = AvitoAdsClient.fromEnv();
app.decorate('avito', avito);

app.get('/balance', async () => {
  const balance = await avito.account.getBalance();
  return { balance: balance.balance };
});
```

**NestJS** (провайдер)

```ts
import { Module } from '@nestjs/common';
import { AvitoAdsClient } from 'avito-ads';

export const AVITO = 'AVITO_ADS_CLIENT';

@Module({
  providers: [{ provide: AVITO, useFactory: () => AvitoAdsClient.fromEnv() }],
  exports: [AVITO],
})
export class AvitoModule {}

// В сервисе:
// constructor(@Inject(AVITO) private readonly avito: AvitoAdsClient) {}
```

**Next.js** (route handler, `app/api/balance/route.ts`)

```ts
import { NextResponse } from 'next/server';
import { AvitoAdsClient } from 'avito-ads';

const avito = AvitoAdsClient.fromEnv();

export async function GET() {
  const balance = await avito.account.getBalance();
  return NextResponse.json({ balance: balance.balance });
}
```

## Примеры

В каталоге [`examples/`](examples): `quickstart`, `pagination`, `contracts`, `http-server`. Запуск через [tsx](https://github.com/privatenumber/tsx):

```bash
AVITO_ADS_CLIENT_ID=… AVITO_ADS_CLIENT_SECRET=… AVITO_ADS_ACCOUNT_ID=… \
AVITO_ADS_ENVIRONMENT=sandbox npx tsx examples/quickstart.ts
```

## Разработка

```bash
npm install
npm run typecheck   # tsc --noEmit
npm run lint        # ESLint
npm run format      # Prettier
npm test            # Vitest (моки fetch, без сети)
npm run build       # сборка ESM + CJS + .d.ts (tsup)
npm run check:version  # package.json == openapi.json (info.version) == API_VERSION
```

Интеграционные тесты против песочницы по умолчанию пропускаются:

```bash
AVITO_ADS_RUN_INTEGRATION=1 AVITO_ADS_CLIENT_ID=… AVITO_ADS_CLIENT_SECRET=… \
AVITO_ADS_ACCOUNT_ID=… AVITO_ADS_ENVIRONMENT=sandbox npm test
```

## Лицензия

[MIT](LICENSE).
