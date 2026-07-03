import { describe, it, expect } from 'vitest';
import app from '../src/index';

describe('GET /', () => {
  it('returns the hello text', async () => {
    const res = await app.request('/');
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('Hello Hono!');
  });
});
