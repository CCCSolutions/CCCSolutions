import { z } from 'zod';

// Allowlist for R2 keys (mirrors scripts/stage-r2.js). Matches:
//   contests/<year>/<code>/tests/<n>.in|out        (samples under tests/sample/)
//   contests/<year>/<code>/solutions/<n>.<cpp|py|java|t|txt>
export const keySchema = z
  .string()
  .regex(/^contests\/\d{4}\/[a-z]\d+\/(tests\/(sample\/)?\d+\.(in|out)|solutions\/\d+\.(cpp|py|java|t|txt))$/);
