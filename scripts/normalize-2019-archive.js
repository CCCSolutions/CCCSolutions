#!/usr/bin/env node
// Normalize ~/Downloads/2019CCCSeniorTestData/ into the staging tree at
// ~/r2-staging/contests/2019/{s2,s3,s4,s5}/.
//
// Source format (CCC subtask layout). Sample naming is inconsistent across
// problems; three variants observed in the 2019 archive:
//   {code}.0-sample.{in|out}            (s2)         seq 0
//   {code}.sample{NN}.{in|out}          (s3)         seq NN
//   {code}.sample.{in|out}              (s4, s5)     seq 0
//   {code}.{group}-{seq}.{in|out}       graded, by subtask group
//
// Target format (matches stage-r2.js output):
//   tests/{n}.{in|out}                  flattened: sort by (group,seq), dense from 1
//   tests/sample/{n}.{in|out}
//
// Skipped:
//   - s1_j4 (the website already has both 2019/s1 and 2019/j4)
//
// Run order:
//   1. node scripts/stage-r2.js                   (wipes contests/, processes website)
//   2. node scripts/normalize-2019-archive.js     (this file — fills 2019/s2..s5)

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const SRC = path.join(os.homedir(), 'Downloads', '2019CCCSeniorTestData');
const DST = path.join(os.homedir(), 'r2-staging', 'contests', '2019');

const CODES = ['s2', 's3', 's4', 's5'];

const SAMPLE_RE = /^([a-z]\d)\.0-sample\.(in|out)$/;
const GRADED_RE = /^([a-z]\d)\.(\d+)-(\d+)\.(in|out)$/;

function copy(src, dst) {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst, fs.constants.COPYFILE_FICLONE);
}

function writeStream(entries, srcDir, dstDir) {
  if (entries.length === 0) return 0;
  let n = 1;
  for (const { files } of entries) {
    for (const ext of ['in', 'out']) {
      if (files[ext]) {
        copy(path.join(srcDir, files[ext]), path.join(dstDir, `${n}.${ext}`));
      }
    }
    n++;
  }
  return entries.length;
}

function processCode(code) {
  const srcDir = path.join(SRC, code);
  if (!fs.existsSync(srcDir)) {
    console.warn(`${code}: source missing at ${srcDir}, skipping`);
    return;
  }

  const dstProblem = path.join(DST, code);
  fs.rmSync(dstProblem, { recursive: true, force: true });

  // collect graded keyed by (group, seq); samples keyed by 0
  const graded = new Map(); // "group:seq" -> { in?, out? }
  const sample = new Map(); // "0" -> { in?, out? }

  for (const f of fs.readdirSync(srcDir)) {
    let m = f.match(SAMPLE_RE);
    if (m && m[1] === code) {
      if (!sample.has('0')) sample.set('0', {});
      sample.get('0')[m[2]] = f;
      continue;
    }
    m = f.match(GRADED_RE);
    if (m && m[1] === code) {
      const group = parseInt(m[2], 10);
      const seq = parseInt(m[3], 10);
      const key = `${group}:${seq}`;
      if (!graded.has(key)) graded.set(key, { group, seq });
      graded.get(key)[m[4]] = f;
      continue;
    }
    console.warn(`  ! unrecognized: ${f}`);
  }

  // sort graded by (group, seq)
  const gradedSorted = [...graded.values()]
    .sort((a, b) => a.group - b.group || a.seq - b.seq)
    .map(e => ({ files: e }));

  const sampleSorted = [...sample.values()].map(files => ({ files }));

  const gN = writeStream(gradedSorted, srcDir, path.join(dstProblem, 'tests'));
  const sN = writeStream(sampleSorted, srcDir, path.join(dstProblem, 'tests', 'sample'));
  console.log(`2019/${code}: ${gN} graded, ${sN} sample`);
}

function main() {
  if (!fs.existsSync(SRC)) {
    console.error(`archive not found: ${SRC}`);
    process.exit(1);
  }
  if (!fs.existsSync(path.dirname(DST))) {
    console.error(`staging tree missing — run scripts/stage-r2.js first`);
    process.exit(1);
  }
  for (const code of CODES) processCode(code);
}

main();