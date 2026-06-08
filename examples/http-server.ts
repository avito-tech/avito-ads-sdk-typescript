/**
 * Интеграция в веб-сервис на встроенном модуле node:http (без зависимостей).
 * Клиент создаётся один раз и переиспользуется во всех запросах.
 * Тот же приём применим к Express/Fastify/NestJS/Next.js — см. README.
 */
import { createServer } from 'node:http';
import { AvitoAdsClient, AvitoApiError, RateLimitError } from '../src/index.js';

const client = AvitoAdsClient.fromEnv();

const server = createServer(async (req, res) => {
  if (req.url !== '/balance') {
    res.writeHead(404).end();
    return;
  }
  try {
    const balance = await client.account.getBalance();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ balance: balance.balance, bonus: balance.bonusBalance }));
  } catch (err) {
    const status = err instanceof RateLimitError ? 429 : err instanceof AvitoApiError ? 502 : 500;
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'unknown' }));
  }
});

server.listen(8080, () => console.log('слушаю :8080'));
