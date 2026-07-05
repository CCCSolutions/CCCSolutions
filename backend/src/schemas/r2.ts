import { z } from 'zod';

// A CCC problem: contest year + code. Codes are s/j 1-5 (Senior/Junior) and p1-5 (pre-2000).
export const problemParamsSchema = z.object({
  year: z.string().regex(/^\d{4}$/),
  code: z.string().regex(/^[sjp][1-5]$/),
});

// A file within a problem, relative to contests/<year>/<code>/ (mirrors scripts/stage-r2.js):
//   tests/<n>.in|out        (samples under tests/sample/)
//   solutions/<n>.<cpp|py|java|t|txt>
export const fileSchema = z.string().regex(/^(tests\/(sample\/)?\d+\.(in|out)|solutions\/\d+\.(cpp|py|java|t|txt))$/);
