// Upload r2-staging/contests/ to R2.
//
// Each file's R2 key is its path relative to the staging root, e.g.
//   r2-staging/contests/2024/s5/tests/1.in  →  contests/2024/s5/tests/1.in
//
// Resumable: skips files already in R2 with the same size.

import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { createReadStream, statSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import * as path from 'node:path';

const ACCOUNT_ID = '';
const STAGING_DIR = '';
const CONCURRENCY = 16;

const { R2_BUCKET, R2_ACCESS_KEY, R2_SECRET_KEY } = process.env;
if (!R2_BUCKET || !R2_ACCESS_KEY || !R2_SECRET_KEY) {
  console.error('missing env: R2_BUCKET, R2_ACCESS_KEY, or R2_SECRET_KEY');
  process.exit(1);
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY, secretAccessKey: R2_SECRET_KEY },
});

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

async function main() {
  // 1. find local files
  const files = await walk(STAGING_DIR);
  console.log(`local: ${files.length} files`);

  // 2. list everything already in R2 (paginated)
  const existing = new Map<string, number>();
  let token: string | undefined;
  do {
    const res = await s3.send(
      new ListObjectsV2Command({ Bucket: R2_BUCKET, ContinuationToken: token })
    );
    for (const obj of res.Contents ?? []) {
      if (obj.Key && obj.Size != null) existing.set(obj.Key, obj.Size);
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  console.log(`remote: ${existing.size} objects`);

  // 3. build the upload queue, skipping files whose size already matches
  const queue = files
    .map((filePath) => ({ filePath, key: path.relative(STAGING_DIR, filePath) }))
    .filter(({ filePath, key }) => existing.get(key) !== statSync(filePath).size);
  const skipped = files.length - queue.length;
  console.log(`uploading ${queue.length}, skipping ${skipped}`);

  // 4. upload with bounded concurrency
  let done = 0, failed = 0;
  const start = Date.now();
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (queue.length > 0) {
        const { filePath, key } = queue.shift()!;
        try {
          await new Upload({
            client: s3,
            params: { Bucket: R2_BUCKET, Key: key, Body: createReadStream(filePath) },
          }).done();
          done++;
        } catch (err) {
          failed++;
          console.error(`FAILED ${key}: ${(err as Error).message}`);
        }
        if ((done + failed) % 50 === 0) {
          console.log(`  ${done + failed} processed (${failed} failed)`);
        }
      }
    })
  );

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\ndone in ${elapsed}s — uploaded ${done}, failed ${failed}, skipped ${skipped}`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});