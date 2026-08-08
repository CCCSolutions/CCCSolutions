import { Hono } from 'hono';
import type { Bindings } from '../types';
import { requireAuth, type AuthVars } from '../middleware/auth';

const user = new Hono<{ Bindings: Bindings; Variables: AuthVars }>();

user.get('/me', requireAuth, (c) => c.json(c.get('profile')));

export default user;
