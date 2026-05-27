#!/usr/bin/env node
// Stage website/public/past_contests/ into ~/r2-staging/contests/ in the
// renamed/normalized layout that R2 will hold.
//
//   tests/{n}.in              graded test cases, renumbered dense from 1
//   tests/{n}.out             paired by original index; orphans kept
//   tests/sample/{n}.in       sample cases, separate stream
//   tests/sample/{n}.out
//   solutions/{n}.{ext}       lang detected once; .txt fallback
//
// Run order:
//   1. node scripts/stage-r2.js                   (this file — wipes contests/)
//   2. node scripts/normalize-2019-archive.js     (fills 2019/s2..s5)
//
// The staging tree is never committed to git. Delete after R2 upload.

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const SRC = path.resolve(__dirname, '..', 'website', 'public', 'past_contests');
const DST = path.join(os.homedir(), 'r2-staging', 'contests');

// {code}.{n}.{in|out} or {code}.sample.{n}.{in|out}
const TEST_RE = /^([a-z]\d+)\.(?:(sample)\.)?(\d+)\.(in|out)$/;
// solution.txt / solution2.txt / solution3.txt / solution4.txt
const SOL_RE = /^solution(\d*)\.txt$/;

function detectLanguage(code) {
  if (
    /^var\s+\w+\s*:/m.test(code) ||
    /\bput\s+/.test(code) ||
    /\bget\s+/.test(code) ||
    /^loop\s*$/m.test(code) ||
    /\bend\s+loop/m.test(code) ||
    /\b:=\b/.test(code)
  ) return 'turing';

  if (
    /#include\s*</.test(code) ||
    /using\s+namespace\s+std/.test(code) ||
    /std::/.test(code) ||
    /\bcin\s*>>/.test(code) ||
    /\bcout\s*<</.test(code) ||
    /vector</.test(code) ||
    /int\s+main\s*\(/m.test(code)
  ) return 'cpp';

  if (
    /import java\./m.test(code) ||
    /package /m.test(code) ||
    /public\s+class\s+\w+/m.test(code) ||
    /public\s+static\s+void\s+main/m.test(code) ||
    /System\.out\.print/m.test(code) ||
    /Scanner/m.test(code) ||
    /BufferedReader/m.test(code) ||
    /String\[\]\s+args/m.test(code) ||
    /Integer\.parseInt/m.test(code)
  ) return 'java';

  const trimmed = code.trim();
  if (
    /^(import|from) \w+/m.test(trimmed) ||
    /^def \w+\s*\(/m.test(trimmed) ||
    /^class \w+:/m.test(trimmed) ||
    /input\(\)/.test(code) ||
    /print\(/.test(code) ||
    /\brange\(/.test(code) ||
    /__name__/.test(code) ||
    /\.readline\(\)/.test(code) ||
    /\.append\(/.test(code) ||
    /\beval\(/.test(code) ||
    /^#\s*[A-Z]/.test(trimmed) ||
    /\bfor\s+\w+\s+in\s+/.test(code) ||
    /\bif\s+.*:\s*$/m.test(code)
  ) return 'python';

  if (/\bpublic\b|\bprivate\b|\bprotected\b/.test(code)) return 'java';
  return 'cpp';
}

const LANG_EXT = { turing: 't', cpp: 'cpp', java: 'java', python: 'py' };

function copy(src, dst) {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst, fs.constants.COPYFILE_FICLONE);
}

// Renumber dense by union of `.in` / `.out` indices. Preserves pairing
// when both exist; an orphan output for original index N still lands at
// the same new slot as it would have if the input existed.
function writeStream(map, srcDir, dstDir) {
  if (map.size === 0) return 0;
  const sorted = [...map.keys()].sort((a, b) => a - b);
  let n = 1;
  for (const oldN of sorted) {
    const files = map.get(oldN);
    for (const ext of ['in', 'out']) {
      if (files[ext]) {
        copy(path.join(srcDir, files[ext]), path.join(dstDir, `${n}.${ext}`));
      }
    }
    n++;
  }
  return n - 1;
}

function processTests(srcProblem, dstProblem, code) {
  const testDir = path.join(srcProblem, 'test_data');
  if (!fs.existsSync(testDir)) return { graded: 0, sample: 0 };

  const graded = new Map();
  const sample = new Map();

  for (const f of fs.readdirSync(testDir)) {
    const m = f.match(TEST_RE);
    if (!m) {
      console.warn(`  ! unrecognized: ${f}`);
      continue;
    }
    const [, fileCode, isSample, nStr, ext] = m;
    if (fileCode !== code) {
      console.warn(`  ! code mismatch: ${f} (expected ${code})`);
      continue;
    }
    const n = parseInt(nStr, 10);
    const target = isSample ? sample : graded;
    if (!target.has(n)) target.set(n, {});
    target.get(n)[ext] = f;
  }

  return {
    graded: writeStream(graded, testDir, path.join(dstProblem, 'tests')),
    sample: writeStream(sample, testDir, path.join(dstProblem, 'tests', 'sample')),
  };
}

function processSolutions(srcProblem, dstProblem) {
  const sols = [];
  for (const f of fs.readdirSync(srcProblem)) {
    const m = f.match(SOL_RE);
    if (!m) continue;
    const idx = m[1] === '' ? 1 : parseInt(m[1], 10);
    sols.push({ idx, file: f });
  }
  if (sols.length === 0) return 0;
  sols.sort((a, b) => a.idx - b.idx);

  const dstDir = path.join(dstProblem, 'solutions');
  fs.mkdirSync(dstDir, { recursive: true });
  let n = 1;
  for (const { file } of sols) {
    const content = fs.readFileSync(path.join(srcProblem, file), 'utf8');
    const lang = detectLanguage(content);
    const ext = LANG_EXT[lang] || 'txt';
    fs.writeFileSync(path.join(dstDir, `${n}.${ext}`), content);
    n++;
  }
  return sols.length;
}

function main() {
  if (!fs.existsSync(SRC)) {
    console.error(`source not found: ${SRC}`);
    process.exit(1);
  }

  console.log(`wiping ${DST}`);
  fs.rmSync(DST, { recursive: true, force: true });
  fs.mkdirSync(DST, { recursive: true });

  let problems = 0, empty = 0, graded = 0, samples = 0, solutions = 0;

  const years = fs.readdirSync(SRC)
    .filter(d => /^\d{4}$/.test(d) && fs.statSync(path.join(SRC, d)).isDirectory())
    .sort();

  for (const year of years) {
    const yearDir = path.join(SRC, year);
    const codes = fs.readdirSync(yearDir)
      .filter(d => fs.statSync(path.join(yearDir, d)).isDirectory())
      .sort();

    for (const code of codes) {
      const srcProblem = path.join(yearDir, code);
      const dstProblem = path.join(DST, year, code);

      const t = processTests(srcProblem, dstProblem, code);
      const s = processSolutions(srcProblem, dstProblem);

      problems++;
      graded += t.graded;
      samples += t.sample;
      solutions += s;

      if (t.graded === 0 && t.sample === 0 && s === 0) {
        empty++;
        console.log(`${year}/${code}: empty`);
      } else {
        console.log(`${year}/${code}: ${t.graded} graded, ${t.sample} sample, ${s} sol`);
      }
    }
  }

  console.log(`\n=== summary ===`);
  console.log(`problems: ${problems} (${empty} empty)`);
  console.log(`graded:   ${graded}`);
  console.log(`samples:  ${samples}`);
  console.log(`solutions: ${solutions}`);
  console.log(`output:   ${DST}`);
}

main();