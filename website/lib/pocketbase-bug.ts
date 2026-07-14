// FIXME(pockethost): remove this once the PocketBase instance is upgraded, or when
// the forum moves off PocketBase entirely. Whichever lands first.
//
// The mmhs.pockethost.io instance is pinned to PocketBase 0.22, but PocketHost
// injects its own hook (/home/pockethost/pb.js:51) that calls e.next() -- an API
// that only exists in PocketBase 0.23+. On 0.22 the event object has no `next`
// member, so the hook throws:
//
//   TypeError: Object has no member 'next' at /home/pockethost/pb.js:51:11
//
// That hook runs AFTER the row is inserted, so every record create COMMITS and
// THEN returns 400. Verified against both `comments` and `posts`: the record is
// in the database, and the client still gets an error. So the write succeeded and
// the API lied about it.
//
// We can't fix it from here (it's PocketHost's file, and the version selector is
// on their control panel, not ours), so we detect the exact failure signature and
// treat it as success. Deliberately narrow: a genuine PocketBase validation error
// returns a POPULATED `data` object (e.g. {"post": {"code": "validation_..."}}),
// while this bug returns the generic message with `data: {}`. Real failures still
// surface to the user.
export function isPostCommitHookBug(error: unknown): boolean {
  const err = error as { status?: number; response?: { data?: Record<string, unknown> } };
  if (err?.status !== 400) return false;
  const data = err.response?.data;
  return !data || Object.keys(data).length === 0;
}
