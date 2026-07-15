// scripts/migrate-pocketbase.ts
//
// PocketBase (0.22) -> Supabase.
//   pb.users    -> profiles   (auth_user_id left NULL — these can't log in;
//                              real logins are created fresh via Google OAuth,
//                              see setup_new_user_trigger.sql)
//   pb.posts    -> posts      (profile_id set from the migrated author)
//   pb.comments -> comments   (profile_id + post_id set from migrated rows)
//
// Per current schema: only `username` is migrated from PocketBase.
// `avatar_url` is left NULL for every migrated profile (not backfilled from
// PB's avatar file field) — user picks/uploads their own after signing up
// fresh via OAuth. No email is stored on `profiles` at all; email only ever
// exists on real `auth.users` rows, which migrated accounts don't have.
//
// Run with: npx tsx scripts/migrate-pocketbase.ts
//
// Required env vars (.dev.vars):
//   POCKETBASE_URL, POCKETBASE_ADMIN_EMAIL, POCKETBASE_ADMIN_PASSWORD
//   DATABASE_URL

import { config } from 'dotenv';
config({ path: '.dev.vars' });

// ----------------------------------------------------------------------------
// PocketBase record shapes (only the fields we care about)
// ----------------------------------------------------------------------------
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
  upvotes: number;
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

// ----------------------------------------------------------------------------
// PocketBase API helpers (0.22 — pre-superusers admin auth)
// ----------------------------------------------------------------------------
async function pbAdminAuth(): Promise<string> {
  const res = await fetch(`${PB_URL}/api/admins/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: PB_ADMIN_EMAIL, password: PB_ADMIN_PASSWORD }),
  });
  if (!res.ok) throw new Error(`PB admin auth failed: ${res.status} ${await res.text()}`);
  const { token } = await res.json();
  return token;
}

async function pbFetchAll<T>(collection: string, token: string): Promise<T[]> {
  const items: T[] = [];
  let page = 1;
  while (true) {
    const res = await fetch(
      `${PB_URL}/api/collections/${collection}/records?perPage=500&page=${page}`,
      { headers: { Authorization: token } },
    );
    if (!res.ok) throw new Error(`PB fetch ${collection} page ${page} failed: ${res.status}`);
    const data = await res.json();
    items.push(...data.items);
    if (page >= data.totalPages) break;
    page++;
  }
  return items;
}

// ----------------------------------------------------------------------------
// Migration
// ----------------------------------------------------------------------------
async function migrate() {
  // Dynamic import: guarantees dotenv's config() above has already run
  // before db/index.ts (which reads DATABASE_URL at load time) is evaluated.
  const { db } = await import('../src/db');
  const { profiles, posts, comments } = await import('../src/db/schema');

  const pbToken = await pbAdminAuth();

  console.log('Fetching from PocketBase...');
  const pbUsers = await pbFetchAll<PbUser>('users', pbToken);
  const pbPosts = await pbFetchAll<PbPost>('posts', pbToken);
  const pbComments = await pbFetchAll<PbComment>('comments', pbToken);
  console.log(`Fetched ${pbUsers.length} users, ${pbPosts.length} posts, ${pbComments.length} comments`);

  // --- Profiles: username only, avatar_url NULL, auth_user_id NULL ------------
  const profileIdMap = new Map<string, string>(); // pb user id -> new profile uuid

  for (const pbUser of pbUsers) {
    const baseUsername = pbUser.username || `user_${pbUser.id.slice(0, 8)}`;

    // usernames must be unique; fall back to a numbered suffix on conflict
    let username = baseUsername;
    let attempt = 0;
    let inserted;
    while (!inserted) {
      const result = await db
        .insert(profiles)
        .values({
          username,
          avatarUrl: null,       // not migrated — user sets this after re-signing up
          role: 'user',
          createdAt: new Date(pbUser.created),
          // authUserId intentionally omitted -> NULL, no login possible
        })
        .onConflictDoNothing({ target: profiles.username })
        .returning({ id: profiles.id });

      if (result.length > 0) {
        inserted = result[0];
      } else {
        attempt++;
        username = `${baseUsername}_${attempt}`;
        if (attempt > 20) throw new Error(`Could not find a free username for ${baseUsername}`);
      }
    }

    profileIdMap.set(pbUser.id, inserted.id);
  }
  console.log(`Migrated ${profileIdMap.size} profiles (unlinked — no login, no avatar)`);

  // --- Posts: reference the migrated profile via profileId ---------------------
  const postIdMap = new Map<string, string>();

  for (const pbPost of pbPosts) {
    const newProfileId = pbPost.author ? profileIdMap.get(pbPost.author) ?? null : null;

    const [inserted] = await db
      .insert(posts)
      .values({
        profileId: newProfileId,
        title: pbPost.title,
        content: pbPost.body,
        score: pbPost.upvotes ?? 0,
        createdAt: new Date(pbPost.created),
      })
      .returning({ id: posts.id });

    postIdMap.set(pbPost.id, inserted.id);
  }
  console.log(`Migrated ${postIdMap.size} posts`);

  // --- Comments ------------------------------------------------------------------
  let commentCount = 0;
  let commentSkipped = 0;

  for (const pbComment of pbComments) {
    const newPostId = pbComment.post ? postIdMap.get(pbComment.post) : undefined;
    if (!newPostId) {
      commentSkipped++;
      continue; // comment pointed at a post that wasn't migrated / never set
    }

    const newProfileId = pbComment.author ? profileIdMap.get(pbComment.author) ?? null : null;

    await db.insert(comments).values({
      postId: newPostId,
      profileId: newProfileId,
      content: pbComment.body,
      createdAt: new Date(pbComment.created),
    });
    commentCount++;
  }
  console.log(`Migrated ${commentCount} comments (${commentSkipped} skipped — no matching post)`);

  console.log('Done. Migrated profiles cannot log in — username preserved for attribution only.');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});