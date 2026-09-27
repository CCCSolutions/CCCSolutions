import { describe, it, expect, vi, afterEach } from 'vitest';
import { scheduled } from '../../src/scheduled';
import type { Bindings } from '../../src/types';
import { env, isDbReachable } from './env';

const dbUp = await isDbReachable();

// Runs one cron against the local DB. The handler hands its job to waitUntil, so
// collect it there and await it, as the Workers runtime would.
async function runCron(cron: string, bindings: Bindings) {
  const jobs: Promise<unknown>[] = [];
  const ctx = { waitUntil: (job: Promise<unknown>) => jobs.push(job) } as unknown as ExecutionContext;
  await scheduled({ cron } as ScheduledController, bindings, ctx);
  await Promise.all(jobs);
}

describe.skipIf(!dbUp)('scheduled crons (integration, local Supabase)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('keep-alive runs its query without logging an error', async () => {
    const logError = vi.spyOn(console, 'error');
    await runCron('0 0 * * *', env as unknown as Bindings);
    expect(logError).not.toHaveBeenCalled();
  });

  it('the daily digest posts the last-24h counts to the webhook', async () => {
    const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(() =>
      Promise.resolve(new Response('{}', { status: 200 })),
    );
    vi.stubGlobal('fetch', fetchMock);
    await runCron('0 1 * * *', {
      ...env,
      DISCORD_WEBHOOK_URL: 'https://discord.com/api/webhooks/1/token',
      FRONTEND_URL: 'https://cccsolutions.ca',
    } as unknown as Bindings);

    expect(fetchMock).toHaveBeenCalledOnce();
    const body = JSON.parse(fetchMock.mock.calls[0][1]?.body as string);
    expect(body.embeds[0].description).toMatch(/^Last 24h: \d+ post\(s\), \d+ comment\(s\)\.$/);
  });
});
