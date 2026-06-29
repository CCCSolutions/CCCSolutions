import { describe, it, expect, vi, beforeEach } from 'vitest';
import { jwtVerify } from 'jose';
import app from '../src/index';
import type { Bindings } from '../src/types';

// Mock `jose` so JWT tests never touch the network (no real JWKS fetch).
vi.mock('jose', () => ({
  createRemoteJWKSet: vi.fn(() => ({}) as unknown),
  jwtVerify: vi.fn(),
}));

const mockedJwtVerify = vi.mocked(jwtVerify);

// Minimal fake env: the middleware only reads the two ACCESS_* vars.
const env = {
  ACCESS_TEAM_DOMAIN: 'https://team.cloudflareaccess.com',
  ACCESS_AUD: 'test-aud',
} as unknown as Bindings;

const WORKERS_DEV = 'https://preview-cccsolutions-backend.willi64645.workers.dev/';
const PROD = 'https://api.cccsolutions.ca/';

beforeEach(() => {
  mockedJwtVerify.mockReset();
});

describe('Access JWT middleware', () => {
  it('passes through requests to the public custom domain without a JWT', async () => {
    const res = await app.request(PROD, {}, env);

    expect(res.status).toBe(200);
    expect(await res.text()).toBe('Hello Hono!');
    expect(mockedJwtVerify).not.toHaveBeenCalled();
  });

  it('rejects a *.workers.dev request that has no Cf-Access-Jwt-Assertion header', async () => {
    const res = await app.request(WORKERS_DEV, {}, env);

    expect(res.status).toBe(403);
    expect(await res.text()).toBe('Forbidden');
    expect(mockedJwtVerify).not.toHaveBeenCalled();
  });

  it('passes a *.workers.dev request when jwtVerify resolves (valid token)', async () => {
    mockedJwtVerify.mockResolvedValue({} as never);

    const res = await app.request(WORKERS_DEV, { headers: { 'Cf-Access-Jwt-Assertion': 'valid.jwt.token' } }, env);

    expect(res.status).toBe(200);
    expect(await res.text()).toBe('Hello Hono!');
    expect(mockedJwtVerify).toHaveBeenCalledTimes(1);
  });

  it('verifies the token against the configured issuer + audience', async () => {
    mockedJwtVerify.mockResolvedValue({} as never);

    await app.request(WORKERS_DEV, { headers: { 'Cf-Access-Jwt-Assertion': 'valid.jwt.token' } }, env);

    const [token, , options] = mockedJwtVerify.mock.calls[0];
    expect(token).toBe('valid.jwt.token');
    expect(options).toMatchObject({
      issuer: env.ACCESS_TEAM_DOMAIN,
      audience: env.ACCESS_AUD,
    });
  });

  it('rejects a *.workers.dev request when jwtVerify throws (invalid/expired token)', async () => {
    mockedJwtVerify.mockRejectedValue(new Error('signature verification failed'));

    const res = await app.request(WORKERS_DEV, { headers: { 'Cf-Access-Jwt-Assertion': 'tampered.jwt.token' } }, env);

    expect(res.status).toBe(403);
    expect(await res.text()).toBe('Forbidden');
    expect(mockedJwtVerify).toHaveBeenCalledTimes(1);
  });

  it('never validates a JWT for the public domain even when a header is present', async () => {
    const res = await app.request(PROD, { headers: { 'Cf-Access-Jwt-Assertion': 'whatever' } }, env);

    expect(res.status).toBe(200);
    expect(mockedJwtVerify).not.toHaveBeenCalled();
  });
});
