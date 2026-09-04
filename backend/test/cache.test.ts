import type { Context } from 'hono';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { purgeCacheTags } from '../src/cache';
import type { Bindings } from '../src/types';

const env = {
  DISCORD_WEBHOOK_URL: 'https://discord.com/api/webhooks/1/token',
  FRONTEND_URL: 'https://cccsolutions.ca',
} as Bindings;

type PurgeResult = { success: boolean; errors: { code: number; message: string }[] };

function testContext(purge?: (options: { tags?: string[] }) => Promise<PurgeResult>) {
  const backgroundTasks: Promise<unknown>[] = [];
  const executionCtx = {
    cache: purge ? { purge } : undefined,
    waitUntil: vi.fn((promise: Promise<unknown>) => {
      backgroundTasks.push(promise);
    }),
    passThroughOnException: vi.fn(),
    props: {},
  };
  const c = { env, executionCtx } as unknown as Context<{ Bindings: Bindings }>;

  return {
    c,
    executionCtx,
    async settle() {
      await Promise.all(backgroundTasks);
    },
  };
}

function webhookBody(fetchMock: ReturnType<typeof vi.fn>) {
  return JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('purgeCacheTags', () => {
  it('purges in waitUntil and stays silent on success', async () => {
    const purge = vi.fn(async () => ({ success: true, errors: [] }));
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { c, executionCtx, settle } = testContext(purge);

    purgeCacheTags(c, ['forum-posts'], 'forum');
    await settle();

    expect(executionCtx.waitUntil).toHaveBeenCalledOnce();
    expect(purge).toHaveBeenCalledWith({ tags: ['forum-posts'] });
    expect(console.error).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('logs and sends a Discord alert when the Cache API reports failure', async () => {
    const purge = vi.fn(async () => ({ success: false, errors: [{ code: 1001, message: 'unavailable' }] }));
    const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const { c, settle } = testContext(purge);

    purgeCacheTags(c, ['forum-posts'], 'forum');
    await settle();

    expect(console.error).toHaveBeenCalledWith('workers cache purge failed', {
      scope: 'forum',
      tags: ['forum-posts'],
      failure: '1001: unavailable',
    });
    const body = webhookBody(fetchMock);
    expect(body.content).toBe('@everyone');
    expect(body.embeds[0].title).toBe('Workers cache purge failed');
    expect(body.embeds[0].description).toContain('Tags: forum-posts');
  });

  it('logs and alerts when cache.purge rejects', async () => {
    const purge = vi.fn(async (): Promise<PurgeResult> => {
      throw new Error('connection reset');
    });
    const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const { c, settle } = testContext(purge);

    purgeCacheTags(c, ['contest:2024:s1'], 'contest 2024/s1');
    await settle();

    expect(console.error).toHaveBeenCalledWith('workers cache purge failed', {
      scope: 'contest 2024/s1',
      tags: ['contest:2024:s1'],
      failure: 'Error: connection reset',
    });
    expect(webhookBody(fetchMock).embeds[0].description).toContain('Scope: contest 2024/s1');
  });

  it('does nothing when the runtime has no Workers Cache context', () => {
    const { c, executionCtx } = testContext();

    purgeCacheTags(c, ['forum-posts'], 'forum');

    expect(executionCtx.waitUntil).not.toHaveBeenCalled();
  });
});
