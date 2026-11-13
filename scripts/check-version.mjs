/**
 * Проверяет, что версия SDK согласована во всех источниках:
 * package.json, package-lock.json, openapi.json (info.version) и константы
 * API_VERSION / SDK_VERSION в src/version.ts. Расхождение — код выхода 1.
 *
 * Запуск: npm run check:version
 */
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const constant = (source, name) => {
  const match = source.match(new RegExp(`export const ${name} = '([^']+)'`));
  return match ? match[1] : undefined;
};

const versionSource = read('src/version.ts');
const sources = {
  'package.json version': JSON.parse(read('package.json')).version,
  'package-lock.json version': JSON.parse(read('package-lock.json')).version,
  'openapi.json info.version': JSON.parse(read('openapi.json')).info.version,
  'src/version.ts API_VERSION': constant(versionSource, 'API_VERSION'),
  'src/version.ts SDK_VERSION': constant(versionSource, 'SDK_VERSION'),
};

const values = new Set(Object.values(sources));
for (const [name, value] of Object.entries(sources)) {
  console.log(`${name}: ${value ?? '(не найдено)'}`);
}
if (values.size !== 1 || values.has(undefined)) {
  console.error('Версии расходятся: версия пакета, openapi.json и API_VERSION должны совпадать.');
  process.exit(1);
}
console.log(`OK: версия ${[...values][0]} согласована.`);
