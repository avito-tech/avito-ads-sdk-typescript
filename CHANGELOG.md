# Changelog

Все заметные изменения в этом проекте документируются в этом файле.

Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.0.0/),
проект придерживается [семантического версионирования](https://semver.org/lang/ru/).

## [1.4.0] — 2026-11-13

Синхронизация с публичным swagger 1.4.0. С этого релиза версия SDK совпадает с версией
публичного API (swagger).

### Added

- Константы `API_VERSION` и `SDK_VERSION` (`1.4.0`), `DEFAULT_USER_AGENT`; `openapi.json` в
  корне репозитория — копия swagger 1.4.0. Проверка в CI (`npm run check:version`): версия в
  `package.json` == `info.version` в `openapi.json` == `API_VERSION`.
- Денежные поля в копейках: `Balance.balanceKopeks`, `Balance.bonusBalanceKopeks`,
  `StatsData.spendKopeks`, `StatsData.spendBonusKopeks`, `Campaign.budgetKopeks`,
  `Group.budgetKopeks`, `Group.priceKopeks`.
- `statusReasons` (массив кодов) и `topStatusReason` (строка) у кампаний, групп и креативов.
- Кампания: `budgetFrequency` (`daily` / `entirePeriod` / `mixed`),
  `performanceAdditionalAgreementID`.
- Группа: `frequencyRules` (`{ count, period }`), `budgetFrequency` (`daily` / `entirePeriod`),
  `actions`, `activitySchedule`, `audienceType`, `format`, `pace`, `periodStartAt`,
  `periodEndAt`, `periodTimezone`, `priceControl`, `scheduleType`, `startASAP`, `userID`,
  `targeting*` (8 полей).
- Креатив: `kktuFields` (`{ key, value }`), `landingID`, `originUrl`, `previewUrl`, `userID`.
- Договор: `isAgentActingForPublisher`, `isCreativeReporter`.
- Песочница: `CreatedAccount.warnings`; ответ `207 Multi-Status` считается успехом.
- Ошибка `ConflictError` (HTTP 409 у `groups.changeBudget` / `groups.changePrice`, наследник
  `AvitoApiError`) и type-guard `isConflictError`.
- Статусы кампании `will_launch_soon`, `partially_active`, `will_stop_soon`, `pausing`,
  `unpausing`; статусы креатива `will_launch_soon`, `pausing`, `unpausing` (константы и фильтры
  `statuses`).
- Перечисления `CampaignBudgetFrequency`, `BudgetFrequency`, `FrequencyPeriod`, `GroupFormat`,
  `AudienceType`, `Paces`, `GroupPriceControl`, `ScheduleType`; тип `OpenEnum<T>`.
- Типы `CampaignStatistic`, `GroupStatistic`, `CreativeStatistic`, `FrequencyRule`,
  `ActivitySchedule`, `KktuFieldValue`, `StatusReasons`.

### Changed

- Поля-перечисления в ответах типизированы как `OpenEnum<T>` (известные значения плюс любая
  строка): неизвестный статус, `budgetFrequency` или код причины разбирается без ошибки.
  Проверка значений — только на входе.
- `statistics.groups()` возвращает `GroupStatistic[]`, `statistics.creatives()` —
  `CreativeStatistic[]`; `paymentModel` / `campaignType` остались только у `CampaignStatistic`,
  `groupId` — только у `CreativeStatistic` (API других полей не возвращает).
- `SandboxAccountInput.actualAddress` необязателен (API подставит `legalAddress`).
- User-Agent по умолчанию — `avito-ads-sdk-typescript/1.4.0` (было
  `avito-ads-typescript/0.1.0`); тот же UA уходит в запрос токена.

### Deprecated

- `Creative.legalInfo` — используйте `kktuFields` (устарело в swagger 1.2.0).
- `Group.frequencyCount` / `Group.frequencyPeriod` — используйте `frequencyRules` (в ответе
  сохранены для совместимости и соответствуют первому правилу).

### Breaking

- `Campaign.budget` и `Campaign.budgetKopeks` — `number | null`: у кампании с
  `budgetFrequency: 'mixed'` сумма отсутствует или `null`, у пустой кампании — `0`.
- `SandboxAccountInput.legalType` обязателен (как в swagger); без него `createSandboxAccount`
  бросает `ValidationError`.
- Пользовательский User-Agent теперь дополняется меткой SDK, а не заменяет её:
  `my-app/1.0 avito-ads-sdk-typescript/1.4.0`.
- Изменения swagger, ломающие клиентов API: из `BudgetFrequency` удалено значение `weekly`;
  входные `frequencyCount` / `frequencyPeriod` при создании группы заменены на `frequencyRules`
  (метода создания группы в SDK нет).

## [1.0.0] - 2026-06-08

### Added

- Первый релиз TypeScript SDK для API Авито Реклама.
- Ресурсы: аккаунт и баланс, дочерние аккаунты и переводы средств/бонусов,
  рекламодатели, договоры (с `ContractBuilder`), кампании, группы, креативы,
  статистика, пользователи.
- OAuth2 `client_credentials` с кэшированием и автоматическим обновлением токена.
- Окружения production и sandbox.
- Автоматические повторы при `429`/`5xx` и обновление токена при `401`.
- Таймаут и отмена через `AbortSignal`.
- Типизированные ошибки (классы и type-guards), чтение `Api-Point-Balance`.
- Постраничная выборка и обход всех страниц через `for await`.
- Без рантайм-зависимостей (нативный `fetch`); поставка ESM + CommonJS и `.d.ts`.
- Тесты на Vitest (моки `fetch`); примеры в каталоге `examples`.
