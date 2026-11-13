/**
 * Версия SDK и публичного API.
 *
 * Единственный источник версии в коде. Должна совпадать с `version` в
 * `package.json` и `info.version` в `openapi.json`; совпадение проверяет
 * `npm run check:version` в CI.
 */

/** Версия публичного API Авито Рекламы (swagger), которой соответствует SDK. */
export const API_VERSION = '1.4.0';

/** Версия SDK. Совпадает с версией публичного API (swagger). */
export const SDK_VERSION = '1.4.0';

/** Метка SDK в User-Agent (без версии). По ней сервер определяет, что запрос пришёл из SDK. */
export const SDK_USER_AGENT_PRODUCT = 'avito-ads-sdk-typescript';

/** User-Agent по умолчанию: `avito-ads-sdk-typescript/<версия>`. */
export const DEFAULT_USER_AGENT = `${SDK_USER_AGENT_PRODUCT}/${SDK_VERSION}`;

/**
 * Собирает значение заголовка User-Agent.
 *
 * Пользовательский UA не заменяет метку SDK: метка дописывается через пробел
 * (`my-app/1.0 avito-ads-sdk-typescript/1.4.0`). Если пользовательский UA уже
 * содержит `avito-ads-sdk-typescript/` (без учёта регистра), метка второй раз не
 * дописывается.
 */
export function buildUserAgent(custom?: string): string {
  const value = custom?.trim();
  if (!value) {
    return DEFAULT_USER_AGENT;
  }
  if (value.toLowerCase().includes(`${SDK_USER_AGENT_PRODUCT}/`)) {
    return value;
  }
  return `${value} ${DEFAULT_USER_AGENT}`;
}
