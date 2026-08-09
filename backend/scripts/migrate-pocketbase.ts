// PocketBase -> Supabase. Migrates users/posts/comments for attribution only:
// profiles get auth_user_id NULL (no login); real accounts are created fresh.
// Run: bun run scripts/migrate-pocketbase.ts
// .dev.vars needs: POCKETBASE_URL, POCKETBASE_ADMIN_EMAIL, POCKETBASE_ADMIN_PASSWORD, DATABASE_URL

import { config } from 'dotenv';
config({ path: '.dev.vars' });

import { getDb } from '../src/db';
import { profiles, posts, comments } from '../src/db/schema';
import type { Bindings } from '../src/types';

interface PbUser {
  id: string;
  username: string;
  created: string;
}
interface PbPost {
  id: string;
  title: string;
  body: string;
  author: string;
  created: string;
}
interface PbComment {
  id: string;
  body: string;
  author: string;
  post: string;
  created: string;
}

const PB_URL = process.env.POCKETBASE_URL!;
const PB_ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL!;
const PB_ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD!;

async function pbAdminAuth(): Promise<string> {
  const body = JSON.stringify({ identity: PB_ADMIN_EMAIL, password: PB_ADMIN_PASSWORD });
  // 0.23+ renamed admins to _superusers; try it first, fall back to 0.22.
  const paths = ['/api/collections/_superusers/auth-with-password', '/api/admins/auth-with-password'];
  for (const path of paths) {
    const res = await fetch(`${PB_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    if (res.ok) return ((await res.json()) as { token: string }).token;
  }
  throw new Error('PB admin auth failed on both endpoints');
}

async function pbFetchAll<T>(collection: string, token: string): Promise<T[]> {
  const items: T[] = [];
  let page = 1;
  while (true) {
    const res = await fetch(`${PB_URL}/api/collections/${collection}/records?perPage=500&page=${page}`, {
      headers: { Authorization: token },
    });
    if (!res.ok) throw new Error(`PB fetch ${collection} page ${page}: ${res.status}`);
    const data = (await res.json()) as { items: T[]; totalPages: number };
    items.push(...data.items);
    if (page >= data.totalPages) break;
    page++;
  }
  return items;
}

async function migrate() {
  const db = getDb(process.env as unknown as Bindings);
  const token = await pbAdminAuth();

  const pbUsers = await pbFetchAll<PbUser>('users', token);
  const pbPosts = await pbFetchAll<PbPost>('posts', token);
  const pbComments = await pbFetchAll<PbComment>('comments', token);
  console.log(`Fetched ${pbUsers.length} users, ${pbPosts.length} posts, ${pbComments.length} comments`);

  const profileIdMap = new Map<string, string>();
  for (const u of pbUsers) {
    const base = u.username || `user_${u.id.slice(0, 8)}`;
    let username = base;
    let attempt = 0;
    let inserted;
    while (!inserted) {
      const [row] = await db
        .insert(profiles)
        .values({ username, avatarUrl: null, role: 'user', createdAt: new Date(u.created) })
        .onConflictDoNothing({ target: profiles.username })
        .returning({ id: profiles.id });
      if (row) inserted = row;
      else if (++attempt > 20) throw new Error(`No free username for ${base}`);
      else username = `${base}_${attempt}`;
    }
    profileIdMap.set(u.id, inserted.id);
  }
  console.log(`Migrated ${profileIdMap.size} profiles`);

  const postIdMap = new Map<string, string>();
  for (const p of pbPosts) {
    const [row] = await db
      .insert(posts)
      .values({
        profileId: p.author ? (profileIdMap.get(p.author) ?? null) : null,
        title: p.title,
        content: p.body,
        createdAt: new Date(p.created),
      })
      .returning({ id: posts.id });
    postIdMap.set(p.id, row.id);
  }
  console.log(`Migrated ${postIdMap.size} posts`);

  let ok = 0;
  let skipped = 0;
  for (const c of pbComments) {
    const postId = c.post ? postIdMap.get(c.post) : undefined;
    if (!postId) {
      skipped++;
      continue;
    }
    await db.insert(comments).values({
      postId,
      profileId: c.author ? (profileIdMap.get(c.author) ?? null) : null,
      content: c.body,
      createdAt: new Date(c.created),
    });
    ok++;
  }
  console.log(`Migrated ${ok} comments (${skipped} skipped, no matching post)`);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
