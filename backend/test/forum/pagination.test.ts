import { describe, it, expect } from 'vitest';
import { resolvePageSize, resolveOffset, DEFAULT_PAGE_SIZE } from '../../src/forum/pagination';

describe('resolvePageSize', () => {
  it('accepts each allow-listed size', () => {
    for (const n of [5, 10, 20, 30, 50]) {
      expect(resolvePageSize(String(n))).toBe(n);
    }
  });

  it('falls back to the default for missing / junk / out-of-list values', () => {
    for (const raw of [undefined, '', 'abc', '0', '-5', '25', '1000', '20.5']) {
      expect(resolvePageSize(raw)).toBe(DEFAULT_PAGE_SIZE);
    }
  });
});

describe('resolveOffset', () => {
  it('parses non-negative integers', () => {
    expect(resolveOffset('0')).toBe(0);
    expect(resolveOffset('40')).toBe(40);
  });

  it('clamps missing / junk / negative values to 0', () => {
    for (const raw of [undefined, '', 'abc', '-1', '-100']) {
      expect(resolveOffset(raw)).toBe(0);
    }
  });
});
