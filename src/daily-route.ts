import { timingSafeEqual } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Probot } from 'probot';
import { runDaily } from './daily.js';

export const DAILY_PATH = '/translation-bot/daily';

export function tokenMatches(header: string | undefined, token: string | undefined): boolean {
  if (!token || !header?.startsWith('Bearer ')) return false;
  const given = Buffer.from(header.slice('Bearer '.length));
  const expected = Buffer.from(token);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

function send(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(body));
}

export function dailyHandler(app: Probot) {
  return async (req: IncomingMessage, res: ServerResponse): Promise<boolean> => {
    if (req.method !== 'POST' || req.url?.split('?')[0] !== DAILY_PATH) return false;

    if (!tokenMatches(req.headers.authorization, process.env['DAILY_TOKEN'])) {
      send(res, 401, { error: 'unauthorized' });
      return true;
    }
    try {
      const outcome = await runDaily(app);
      send(res, outcome.failures ? 500 : 200, outcome);
    } catch (error) {
      app.log.error({ error }, 'daily run failed');
      send(res, 500, { error: 'daily run failed' });
    }
    return true;
  };
}
