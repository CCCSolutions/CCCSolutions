import { apiFetch } from './supabase';

export type VoteMap = Record<string, 1 | -1>;

export async function getMyVotes(
  type: 'post' | 'comment',
  ids: string[],
  signal?: AbortSignal
): Promise<VoteMap> {
  if (ids.length === 0) return {};

  try {
    const query = new URLSearchParams({ type, ids: ids.join(',') });
    const res = await apiFetch(`/forum/votes/mine?${query}`, { signal });
    if (!res.ok) return {};

    const rows = (await res.json()) as { votableId: string; value: 1 | -1 }[];
    return Object.fromEntries(rows.map((row) => [row.votableId, row.value]));
  } catch {
    return {};
  }
}
