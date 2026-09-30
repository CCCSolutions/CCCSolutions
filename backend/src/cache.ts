import type { Context, ExecutionContext as HonoExecutionContext } from 'hono';
import { send } from './notify';
import type { Bindings } from './types';

// Cache tag on GET /contests/index. Every R2 write purges it along with the contest tag.
export const INDEX_CACHE_TAG = 'contests:index';

type CacheExecutionContext = HonoExecutionContext & Pick<ExecutionContext, 'cache'>;

async function reportPurgeFailure(env: Bindings, scope: string, tags: string[], failure: string): Promise<void> {
  console.error('workers cache purge failed', { scope, tags, failure });
  await send(env, {
    kind: 'alert',
    title: 'Workers cache purge failed',
    description: [`Scope: ${scope}`, `Tags: ${tags.join(', ')}`, `Failure: ${failure}`].join('\n'),
    ping: true,
  });
}

// Workers Cache purges share the Free plan limit (5 requests a minute, 100 tags each) whatever
// the account plan, so bulk writes should batch their tags into one purge. Returns true on success.
export async function purgeCacheTagsNow<E extends { Bindings: Bindings }>(
  c: Context<E>,
  tags: string[],
  scope: string,
): Promise<boolean> {
  // Hono's ExecutionContext type has not added Workers Cache's .cache yet.
  const cache = (c.executionCtx as CacheExecutionContext).cache;
  if (!cache) return false;
  try {
    const result = await cache.purge({ tags });
    if (result.success) return true;

    const failure = result.errors.length
      ? result.errors.map((error) => `${error.code}: ${error.message}`).join('\n')
      : 'Cache API returned success=false without details.';
    await reportPurgeFailure(c.env, scope, tags, failure);
  } catch (error) {
    const failure = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    await reportPurgeFailure(c.env, scope, tags, failure);
  }
  return false;
}

// Purging is deliberately post-response: a failed purge must not turn a committed
// DB/R2 write into an apparent 500. The same waitUntil task owns failure reporting,
// so Cloudflare keeps the invocation alive for the Discord alert too.
export function purgeCacheTags<E extends { Bindings: Bindings }>(c: Context<E>, tags: string[], scope: string): void {
  const executionCtx = c.executionCtx as CacheExecutionContext;
  if (!executionCtx.cache) return;
  executionCtx.waitUntil(purgeCacheTagsNow(c, tags, scope));
}
