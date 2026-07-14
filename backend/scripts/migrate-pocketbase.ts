// scripts/migrate-pocketbase.ts
import { config } from 'dotenv';
config({ path: '.dev.vars' });

const PB_URL = process.env.POCKETBASE_URL!;
const PB_ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL!;
const PB_ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD!;

// 💡 ADD THE POCKETBASE IDs YOU WANT TO BE MAIN POSTS/THREADS HERE:
const ELEVATED_POST_IDS = [
  'sl0q5n5pmu6y9ak', 
  'ni4asi3j9myyig2',
  'yhc6y9w96f8h6nk',
  '292zw85rr46a4y9'
];

interface PbUser { id: string; username: string; email: string; created: string; }
interface PbPost { id: string; title: string; body: string; author: string; upvotes: number; created: string; }
interface PbComment { id: string; body: string; author: string; post: string; created: string; }

async function pbAdminAuth(): Promise<string> {
  const res = await fetch(`${PB_URL}/api/admins/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: PB_ADMIN_EMAIL, password: PB_ADMIN_PASSWORD }),
  });
  if (!res.ok) throw new Error(`PB admin auth failed: ${res.status}`);
  const { token } = await res.json();
  return token;
}

async function pbFetchAll<T>(collection: string, token: string): Promise<T[]> {
  const items: T[] = [];
  let page = 1;
  while (true) {
    const res = await fetch(`${PB_URL}/api/collections/${collection}/records?perPage=500&page=${page}`, {
      headers: { Authorization: token }
    });
    const data = await res.json();
    items.push(...data.items);
    if (page >= data.totalPages) break;
    page++;
  }
  return items;
}

async function migrate() {
  const { db } = await import('../src/db');
  const { users, posts, solutions, comments } = await import('../src/db/schema');

  const token = await pbAdminAuth();
  console.log('Fetching from PocketBase...');
  const pbUsers = await pbFetchAll<PbUser>('users', token);
  const pbPosts = await pbFetchAll<PbPost>('posts', token);
  const pbComments = await pbFetchAll<PbComment>('comments', token);

  // --- 1. Migrate Users ---
  const userIdMap = new Map<string, string>();
  for (const pbUser of pbUsers) {
    const username = pbUser.username || pbUser.email.split('@')[0];
    const [inserted] = await db.insert(users).values({ username, role: 'user' }).onConflictDoNothing({ target: users.username }).returning({ id: users.id });
    if (inserted) userIdMap.set(pbUser.id, inserted.id);
    else {
      const existing = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.username, username) });
      if (existing) userIdMap.set(pbUser.id, existing.id);
    }
  }

  // --- 2. Process Posts (Split Logic) ---
  const postIdMap = new Map<string, string>(); // Maps PB post ID -> Supabase Post UUID
  
  // Separate elevated posts from regular solutions
  const elevatedPbPosts = pbPosts.filter(p => ELEVATED_POST_IDS.includes(p.id));
  const solutionPbPosts = pbPosts.filter(p => !ELEVATED_POST_IDS.includes(p.id));

  // A. Insert Elevated Forum Posts First
  console.log(`Migrating ${elevatedPbPosts.length} elevated standalone posts...`);
  for (const pbPost of elevatedPbPosts) {
    const newUserId = pbPost.author ? userIdMap.get(pbPost.author) ?? null : null;
    const [insertedPost] = await db.insert(posts).values({
      userId: newUserId,
      title: pbPost.title,
      content: pbPost.body, // Keeps body directly in the post
      score: pbPost.upvotes ?? 0,
      createdAt: new Date(pbPost.created),
    }).returning({ id: posts.id });

    postIdMap.set(pbPost.id, insertedPost.id);
  }

  // B. Fallback Parent Thread (For items that are just code solutions)
  // This avoids creating infinite wrapper threads. All regular solutions attach here.
  const [generalThread] = await db.insert(posts).values({
    title: 'Archive Solutions Collection',
    content: 'Migrated programming code submissions and solutions from the archive database.',
    score: 0,
  }).returning({ id: posts.id });

  // C. Insert Everything Else as a Solution
  console.log(`Migrating ${solutionPbPosts.length} items as solutions...`);
  for (const pbPost of solutionPbPosts) {
    const newUserId = pbPost.author ? userIdMap.get(pbPost.author) ?? null : null;
    
    await db.insert(solutions).values({
      postId: generalThread.id, // Attaches to the single shared archive thread
      userId: newUserId,
      language: 'cpp',
      content: pbPost.body,
      createdAt: new Date(pbPost.created),
    });

    // Map comments targeting this PB post to the general thread instead
    postIdMap.set(pbPost.id, generalThread.id);
  }

  // --- 3. Migrate Comments ---
  let commentCount = 0;
  let skipped = 0;
  for (const pbComment of pbComments) {
    const newPostId = pbComment.post ? postIdMap.get(pbComment.post) : undefined;
    if (!newPostId) {
      skipped++;
      continue;
    }
    const newUserId = pbComment.author ? userIdMap.get(pbComment.author) ?? null : null;

    await db.insert(comments).values({
      postId: newPostId,
      userId: newUserId,
      content: pbComment.body,
      createdAt: new Date(pbComment.created),
    });
    commentCount++;
  }

  console.log(`Done. Migrated ${commentCount} comments.`);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});