import type { Context, ExecutionContext as HonoExecutionContext } from 'hono';
import { send } from './notify';
import type { Bindings } from './types';

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

// Purging is deliberately post-response: a failed purge must not turn a committed
// DB/R2 write into an apparent 500. The same waitUntil task owns failure reporting,
// so Cloudflare keeps the invocation alive for the Discord alert too.
export function purgeCacheTags<E extends { Bindings: Bindings }>(c: Context<E>, tags: string[], scope: string): void {
  // Hono's ExecutionContext type has not added Workers Cache's .cache yet.
  const executionCtx = c.executionCtx as CacheExecutionContext;
  const cache = executionCtx.cache;
  if (!cache) return;

  const purgeAndReport = (async () => {
    try {
      const result = await cache.purge({ tags });
      if (result.success) return;

      const failure = result.errors.length
        ? result.errors.map((error) => `${error.code}: ${error.message}`).join('\n')
        : 'Cache API returned success=false without details.';
      await reportPurgeFailure(c.env, scope, tags, failure);
    } catch (error) {
      const failure = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
      await reportPurgeFailure(c.env, scope, tags, failure);
    }
  })();

  executionCtx.waitUntil(purgeAndReport);
}
