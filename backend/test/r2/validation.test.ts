import { describe, it, expect } from 'vitest';
import { problemParamsSchema, fileSchema } from '../../src/r2/validation';

describe('problemParamsSchema', () => {
  it('accepts s/j codes for 2000 onward', () => {
    for (const code of ['s1', 's5', 'j1', 'j5']) {
      expect(problemParamsSchema.safeParse({ year: '2024', code }).success).toBe(true);
      expect(problemParamsSchema.safeParse({ year: '2000', code }).success).toBe(true);
    }
  });

  it('accepts p codes only before 2000', () => {
    for (const code of ['p1', 'p5']) {
      expect(problemParamsSchema.safeParse({ year: '1999', code }).success).toBe(true);
    }
  });

  it('rejects p codes from 2000 onward and s/j codes before 2000', () => {
    const bad = [
      { year: '2024', code: 'p1' }, // p-codes stopped existing after 1999
      { year: '2000', code: 'p1' }, // 2000 is the first s/j year, not p
      { year: '1999', code: 's1' }, // s/j didn't exist yet
      { year: '1996', code: 'j1' },
    ];
    for (const b of bad) expect(problemParamsSchema.safeParse(b).success).toBe(false);
  });

  it('rejects bad years and codes', () => {
    const bad = [
      { year: '24', code: 's1' }, // year not 4 digits
      { year: '2024', code: 'x1' }, // letter not s/j/p
      { year: '2024', code: 's6' }, // digit out of 1-5
      { year: '2024', code: 's' }, // missing digit
      { year: '2024', code: 's10' }, // two digits
    ];
    for (const b of bad) expect(problemParamsSchema.safeParse(b).success).toBe(false);
  });
});

describe('fileSchema', () => {
  it('accepts valid relative files', () => {
    const ok = ['tests/1.in', 'tests/1.out', 'tests/sample/2.in', 'solutions/1.cpp', 'solutions/3.py', 'solutions/1.t'];
    for (const f of ok) expect(fileSchema.safeParse(f).success).toBe(true);
  });

  it('rejects traversal and out-of-scheme files', () => {
    const bad = [
      '../etc/passwd', // traversal
      'tests/1.txt', // tests are only in/out
      'solutions/1.exe', // ext not allowed
      'contests/2024/s1/tests/1.in', // full key, not relative
      'tests/1', // no extension
    ];
    for (const f of bad) expect(fileSchema.safeParse(f).success).toBe(false);
  });
});
