import { describe, it, expect, vi } from 'vitest';
import { app } from '../src/index';

describe('GET /', () => {
  it('returns the API name + version', async () => {
    const res = await app.request('/');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ name: 'cccsolutions-api', version: 'v1' });
  });

  // TODO: assert the endpoint list / links once `/` returns more API info.
  it.todo('lists available endpoints');
});

describe('GET /health', () => {
  it('returns ok', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });

  // TODO: assert R2 / DB / downstream checks once /health does more than liveness.
  it.todo('reports R2 + DB health');
});

describe('unhandled errors', () => {
  // With no env bound, the route's getDb(c.env) throws: a stand-in for any real fault.
  it('become a JSON 500 that is never cached', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await app.request('/forum/posts/3f2b8c1e-9a4d-4c7e-8b21-5d6f7a8b9c0d');
    expect(res.status).toBe(500);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    expect(await res.json()).toEqual({ error: 'Internal server error' });
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });
});
