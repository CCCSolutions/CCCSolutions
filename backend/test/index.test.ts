import { describe, it, expect } from 'vitest';
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
