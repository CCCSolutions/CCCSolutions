import { describe, it, expect } from 'vitest';
import { keySchema } from '../src/index';

// The R2 key allowlist (mirrors scripts/stage-r2.js). Only the normalized
// `contests/<year>/<code>/...` scheme is accepted; everything else is rejected
// so a request can never reach into the bucket via a crafted key.
describe('keySchema R2 key allowlist', () => {
  describe('accepts valid normalized keys', () => {
    it.each([
      // testcase inputs/outputs
      'contests/2024/s5/tests/1.in',
      'contests/2024/s5/tests/12.out',
      'contests/2024/s5/tests/100.in',
      // sample testcases live under tests/sample/
      'contests/2024/s5/tests/sample/1.in',
      'contests/2024/s5/tests/sample/2.out',
      // solutions in each allowed language extension
      'contests/2024/s5/solutions/1.cpp',
      'contests/2024/s5/solutions/2.py',
      'contests/2024/s5/solutions/3.java',
      'contests/2024/s5/solutions/1.t',
      'contests/2024/s5/solutions/1.txt',
      // boundary years
      'contests/1996/j1/tests/1.in',
      'contests/2026/p3/solutions/1.cpp',
      // every problem-code prefix (j/p/s) with multi-digit numbers
      'contests/2024/j1/tests/1.in',
      'contests/2024/p3/tests/1.out',
      'contests/2024/s5/solutions/10.py',
    ])('valid: %s', (key) => {
      expect(keySchema.safeParse(key).success).toBe(true);
    });
  });

  describe('rejects malformed / unsafe keys', () => {
    it.each([
      // missing the contests/ root prefix
      '2024/s5/tests/1.in',
      'foo/contests/2024/s5/tests/1.in',
      // path traversal
      'contests/../2024/s5/tests/1.in',
      'contests/2024/s5/../solutions/1.cpp',
      '../contests/2024/s5/tests/1.in',
      // legacy pre-migration layout
      'test_data/2024/s5/tests/1.in',
      'contests/2024/s5/test_data/1.in',
      // disallowed extensions
      'contests/2024/s5/solutions/1.rs',
      'contests/2024/s5/solutions/1.js',
      'contests/2024/s5/tests/1.txt',
      'contests/2024/s5/tests/1.cpp',
      // missing segments
      'contests/2024/tests/1.in',
      'contests/2024/s5/1.in',
      'contests/2024/s5/tests/',
      'contests/2024/s5/tests',
      // malformed year / code
      'contests/24/s5/tests/1.in',
      'contests/20245/s5/tests/1.in',
      'contests/2024/S5/tests/1.in',
      'contests/2024/ss/tests/1.in',
      'contests/2024/5s/tests/1.in',
      // non-numeric file stem
      'contests/2024/s5/tests/a.in',
      'contests/2024/s5/solutions/main.cpp',
      // trailing slash / nested junk
      'contests/2024/s5/tests/1.in/',
      'contests/2024/s5/solutions/1.cpp/extra',
      // wrong sample nesting
      'contests/2024/s5/sample/1.in',
      'contests/2024/s5/solutions/sample/1.cpp',
      // empty + whitespace
      '',
      ' ',
      'contests/2024/s5/tests/1.in ',
    ])('invalid: %j', (key) => {
      expect(keySchema.safeParse(key).success).toBe(false);
    });
  });
});
