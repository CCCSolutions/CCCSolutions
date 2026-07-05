import { describe, it, expect } from 'vitest';
import app from '../src/index';

// Pins the CORS allow/deny contract so a future hono upgrade that changes the
// origin-callback behavior fails here instead of silently in prod.
describe('CORS origin allowlist', () => {
  it('echoes an allowed exact origin', async () => {
    const res = await app.request('/', { headers: { Origin: 'https://v2.cccsolutions.ca' } }, {});
    expect(res.headers.get('access-control-allow-origin')).toBe('https://v2.cccsolutions.ca');
  });

  it('echoes an allowed wildcard preview host by suffix', async () => {
    const res = await app.request('/', { headers: { Origin: 'https://abc123.cccsolutions.pages.dev' } }, {});
    expect(res.headers.get('access-control-allow-origin')).toBe('https://abc123.cccsolutions.pages.dev');
  });

  it('sends no allow-origin header for a disallowed origin', async () => {
    const res = await app.request('/', { headers: { Origin: 'https://evil.example.com' } }, {});
    expect(res.headers.get('access-control-allow-origin')).toBeNull();
  });

  it('denies a preflight from a disallowed origin (no allow-origin header)', async () => {
    const res = await app.request(
      '/',
      { method: 'OPTIONS', headers: { Origin: 'https://evil.example.com', 'Access-Control-Request-Method': 'GET' } },
      {},
    );
    expect(res.headers.get('access-control-allow-origin')).toBeNull();
  });
});
