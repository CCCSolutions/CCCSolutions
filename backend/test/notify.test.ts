import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { send } from '../src/notify';
import type { Bindings } from '../src/types';

const env = {
  DISCORD_WEBHOOK_URL: 'https://discord.com/api/webhooks/1/token',
  FRONTEND_URL: 'https://cccsolutions.ca',
} as Bindings;

function mockFetch(res: Response | Error) {
  const fn = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(() =>
    res instanceof Error ? Promise.reject(res) : Promise.resolve(res),
  );
  vi.stubGlobal('fetch', fn);
  return fn;
}

const ok = () => new Response('{}', { status: 200 });

function bodyOf(fn: ReturnType<typeof mockFetch>) {
  return JSON.parse((fn.mock.calls[0][1] as RequestInit).body as string);
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('send', () => {
  it('is a no-op when the webhook is unset', async () => {
    const fetchMock = mockFetch(ok());
    await send({ ...env, DISCORD_WEBHOOK_URL: '' } as Bindings, { kind: 'post', title: 'hi' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('keeps user-supplied text in the embed so it cannot ping the server', async () => {
    const fetchMock = mockFetch(ok());
    await send(env, { kind: 'post', title: '@everyone free robux', description: '@here too' });

    const body = bodyOf(fetchMock);
    expect(body.content).toBe('@everyone');
    expect(body.embeds[0].title).toBe('@everyone free robux');
    expect(body.embeds[0].description).toBe('@here too');
  });

  it('pings by default and stays silent when ping is false', async () => {
    let fetchMock = mockFetch(ok());
    await send(env, { kind: 'post', title: 'x' });
    expect(bodyOf(fetchMock).allowed_mentions).toEqual({ parse: ['everyone'] });

    fetchMock = mockFetch(ok());
    await send(env, { kind: 'digest', title: 'x', ping: false });
    const body = bodyOf(fetchMock);
    expect(body.content).toBeUndefined();
    expect(body.allowed_mentions).toEqual({ parse: [] });
  });

  it('builds the embed link from FRONTEND_URL and omits it without a path', async () => {
    let fetchMock = mockFetch(ok());
    await send(env, { kind: 'post', title: 'x', path: '/forum/abc' });
    expect(bodyOf(fetchMock).embeds[0].url).toBe('https://cccsolutions.ca/forum/abc');

    fetchMock = mockFetch(ok());
    await send(env, { kind: 'post', title: 'x' });
    expect(bodyOf(fetchMock).embeds[0].url).toBeUndefined();
  });

  it('clips over-long text so Discord does not reject the whole message', async () => {
    const fetchMock = mockFetch(ok());
    await send(env, { kind: 'post', title: 'a'.repeat(500), description: 'b'.repeat(5000) });

    const embed = bodyOf(fetchMock).embeds[0];
    expect(embed.title).toHaveLength(256);
    expect(embed.description).toHaveLength(1000);
    expect(embed.description.endsWith('…')).toBe(true);
  });

  it('requests ?wait=true so Discord returns a real error body', async () => {
    const fetchMock = mockFetch(ok());
    await send(env, { kind: 'post', title: 'x' });
    expect(fetchMock.mock.calls[0][0]).toBe(`${env.DISCORD_WEBHOOK_URL}?wait=true`);
  });

  // fetch resolves on 4xx/5xx, so without the res.ok check these fail silently.
  it('logs an HTTP error instead of swallowing it', async () => {
    mockFetch(new Response('unauthorized', { status: 401 }));
    await expect(send(env, { kind: 'post', title: 'x' })).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('401'), 'unauthorized');
  });

  it('logs a network failure without rejecting into the caller', async () => {
    mockFetch(new Error('connection reset'));
    await expect(send(env, { kind: 'post', title: 'x' })).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalledWith('discord webhook failed:', expect.any(Error));
  });
});
