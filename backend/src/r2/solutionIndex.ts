// Solution counts per problem ({ "2026/s2": 2 }), kept in one small R2 object so GET /contests/index
// is a single read instead of listing the whole bucket. Admin writes to a solutions/ file recount
// that one problem. If the object is missing, the next read rebuilds it from a full listing.
export const SOLUTION_INDEX_KEY = 'meta/solution-index.json';

type SolutionCounts = Record<string, number>;

async function scanSolutionCounts(bucket: R2Bucket): Promise<SolutionCounts> {
  const counts: SolutionCounts = {};
  let cursor: string | undefined;
  do {
    const page = await bucket.list({ prefix: 'contests/', cursor });
    for (const obj of page.objects) {
      const m = obj.key.match(/^contests\/(\d{4})\/([sjp][1-5])\/solutions\/\d+\.[a-z]+$/);
      if (m) counts[`${m[1]}/${m[2]}`] = (counts[`${m[1]}/${m[2]}`] ?? 0) + 1;
    }
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  return counts;
}

export async function readSolutionCounts(bucket: R2Bucket): Promise<SolutionCounts> {
  const obj = await bucket.get(SOLUTION_INDEX_KEY);
  if (obj) return JSON.parse(await obj.text()) as SolutionCounts;
  const counts = await scanSolutionCounts(bucket);
  await bucket.put(SOLUTION_INDEX_KEY, JSON.stringify(counts));
  return counts;
}

// Read-modify-write of one shared object: two admin writes at the same moment could lose one
// update. Admin writes are rare and sequential, and deleting the object forces a full rebuild.
export async function recountProblem(bucket: R2Bucket, year: string, code: string): Promise<void> {
  const counts = await readSolutionCounts(bucket);
  const { objects } = await bucket.list({ prefix: `contests/${year}/${code}/solutions/` });
  const key = `${year}/${code}`;
  if (objects.length) counts[key] = objects.length;
  else delete counts[key];
  await bucket.put(SOLUTION_INDEX_KEY, JSON.stringify(counts));
}
