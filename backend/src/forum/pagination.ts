export const PAGE_SIZES = [5, 10, 20, 30, 50] as const;
export const DEFAULT_PAGE_SIZE = 20;

// Only allow the sizes the UI offers; anything else (junk, out-of-range) falls back
// to the default. Kept pure so it's unit-testable without the DB or the Worker.
export function resolvePageSize(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? '', 10);
  return (PAGE_SIZES as readonly number[]).includes(n) ? n : DEFAULT_PAGE_SIZE;
}

export function resolveOffset(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? '', 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}
