// Discord webhook pings for forum activity. An unset DISCORD_WEBHOOK_URL is a
// no-op, so local dev and CI stay silent instead of posting to the real channel.
import type { Context } from 'hono';
import type { Bindings } from './types';

const COLORS = { post: 0x5865f2, comment: 0x57f287, digest: 0x9b59b6 } as const;

export type NotifyEvent = {
  kind: keyof typeof COLORS;
  title: string;
  description?: string;
  actor?: string;
  path?: string;
  ping?: boolean;
};

// Discord rejects the whole message if any embed field is over length (title 256,
// description 4096). 1000 is a readability cap, well inside the limit.
const clip = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);

// Only `content` pings — mentions inside an embed render as text and notify nobody.
// User-supplied title/body therefore goes in the embed, where a post that says
// "@everyone" cannot ping the server; the ping lives in content we author.
export async function send(env: Bindings, e: NotifyEvent): Promise<void> {
  if (!env.DISCORD_WEBHOOK_URL) return;
  const ping = e.ping !== false;

  try {
    // ?wait=true so a rejected message comes back as a real error body, not a bare 204.
    const res = await fetch(`${env.DISCORD_WEBHOOK_URL}?wait=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: ping ? '@everyone' : undefined,
        allowed_mentions: { parse: ping ? ['everyone'] : [] },
        embeds: [
          {
            title: clip(e.title, 256),
            description: e.description ? clip(e.description, 1000) : undefined,
            url: e.path ? `${env.FRONTEND_URL}${e.path}` : undefined,
            color: COLORS[e.kind],
            timestamp: new Date().toISOString(),
            author: e.actor ? { name: clip(e.actor, 256) } : undefined,
          },
        ],
      }),
    });
    // fetch only rejects on network failure: 400/401/429 arrive as ordinary responses,
    // so without this check a revoked webhook fails completely silently.
    if (!res.ok) console.error(`discord webhook ${res.status}:`, await res.text());
  } catch (err) {
    console.error('discord webhook failed:', err);
  }
}

// Fire-and-forget. The DB write has already committed by the time this runs, so
// nothing here may throw into the handler or make the user wait on Discord.
// Generic over the env: Hono's Context is invariant, so a concrete
// Context<{ Bindings }> would reject a route that also declares Variables.
export function notify<E extends { Bindings: Bindings }>(c: Context<E>, e: NotifyEvent): void {
  const sent = send(c.env, e);
  try {
    c.executionCtx.waitUntil(sent);
  } catch {
    // No ExecutionContext (app.request in tests); the send still runs, unawaited.
  }
}
