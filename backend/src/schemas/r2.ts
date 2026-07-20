import { z } from 'zod';

// A CCC problem: contest year + code. Codes are s/j 1-5 (Senior/Junior, 2000+) and
// p1-5 (pre-2000, single division) — the letter is only valid for its own era.
export const problemParamsSchema = z
  .object({
    year: z.string().regex(/^\d{4}$/),
    code: z.string().regex(/^[sjp][1-5]$/),
  })
  .refine(({ year, code }) => (Number(year) < 2000 ? code[0] === 'p' : code[0] !== 'p'), {
    message: 'p-codes only exist before 2000; s/j-codes only exist from 2000 onward',
    path: ['code'],
  });

// A file within a problem, relative to contests/<year>/<code>/ (mirrors scripts/stage-r2.js):
//   tests/<n>.in|out        (samples under tests/sample/)
//   solutions/<n>.<cpp|py|java|t|txt>
export const fileSchema = z.string().regex(/^(tests\/(sample\/)?\d+\.(in|out)|solutions\/\d+\.(cpp|py|java|t|txt))$/);
