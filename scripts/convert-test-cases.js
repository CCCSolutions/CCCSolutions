#!/usr/bin/env node

/**
 * Convert 2016-2025 test cases to standardized sequential format
 *
 * Note: this is genuinely cancer and i hate my life staying up doing this
 * the ccc committee should seriously consider standardizing their test case naming
 * claude sonnet 4.5 saved my bum
 * REDESIGNED to handle:
 * - Chaotic numbering (s5.156.in → s5.1.in)
 * - Dash batches (s1.1-03.in → extract batch 1 only)
 * - Triple dots (j1.01.01.in → j1.01.in)
 * - Sample files (all formats)
 * - Sequential renumbering (limit to 20 test cases max)
 *
 * FROM: /2016+ test cases/2025CCCSeniorTestData/s2/s2.3-141.in
 * TO:   /website/public/past_contests/2025/s2/test_data/s2.1.in (renumbered)
 */

const fs = require('fs');
const path = require('path');

const SOURCE_ROOT = path.join(__dirname, '..', '2016+ test cases');
const DEST_ROOT = path.join(__dirname, '..', 'website', 'public', 'past_contests');

const YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
const MAX_TEST_CASES = 20; // Limit per problem

const DIVISIONS = {
  'Junior': 'j',
  'Senior': 's'
};

/**
 * Parse a test case filename and extract metadata
 * Returns: { batch, caseNum, ext, isSample, originalFile }
 */
function parseTestCaseFile(filename, sourceDir) {
  const fullPath = path.join(sourceDir, filename);

  // Detect sample files (various formats)
  const isSample = /samp/i.test(filename);

  let batch = null;
  let caseNum = null;
  let ext = null;

  // Pattern 1: Dash batches (2022-2025): s1.1-03.in or s1.sample-01.in
  const dashMatch = filename.match(/^[js]\d+\.(\d+|sample)-(\d+)\.(in|out)$/);
  if (dashMatch) {
    [, batch, caseNum, ext] = dashMatch;
    return { batch, caseNum, ext, isSample, originalFile: fullPath };
  }

  // Pattern 2: Triple dots (2020): j1.01.01.in or j1.sample.01.in
  const tripleDotMatch = filename.match(/^[js]\d+\.(sample|\d+)\.(\d+)\.(in|out)$/);
  if (tripleDotMatch) {
    [, batch, caseNum, ext] = tripleDotMatch;
    return { batch, caseNum, ext, isSample: batch === 'sample', originalFile: fullPath };
  }

  // Pattern 3: Standard zero-padded (2017+): j1.01.in or j1sample.01.in
  const zeroPadMatch = filename.match(/^[js]\d+(sample)?\.(\d+)\.(in|out)$/);
  if (zeroPadMatch) {
    const sampleIndicator = zeroPadMatch[1];
    [, , caseNum, ext] = zeroPadMatch;
    return {
      batch: null,
      caseNum,
      ext,
      isSample: !!sampleIndicator || isSample,
      originalFile: fullPath
    };
  }

  // Pattern 4: Simple format (2016): j1.1.in or j1.samp1.in
  const simpleMatch = filename.match(/^[js]\d+\.(samp)?(\d+[a-z]?)\.(in|out)$/);
  if (simpleMatch) {
    const sampleIndicator = simpleMatch[1];
    [, , caseNum, ext] = simpleMatch;
    return {
      batch: null,
      caseNum,
      ext,
      isSample: !!sampleIndicator || isSample,
      originalFile: fullPath
    };
  }

  return null;
}

/**
 * Group and sort test cases, then renumber sequentially
 */
function collectAndRenumberTestCases(sourceDir) {
  if (!fs.existsSync(sourceDir)) {
    return { regular: [], samples: [] };
  }

  const files = fs.readdirSync(sourceDir);

  // Parse all files
  const parsedFiles = files
    .map(file => parseTestCaseFile(file, sourceDir))
    .filter(parsed => parsed !== null);

  // Separate samples from regular test cases
  const sampleFiles = parsedFiles.filter(p => p.isSample);
  const regularFiles = parsedFiles.filter(p => !p.isSample);

  // Group by unique case identifier (batch-caseNum combo)
  const groupedRegular = {};
  const groupedSamples = {};

  regularFiles.forEach(parsed => {
    const key = `${parsed.batch || 'none'}-${parsed.caseNum}`;
    if (!groupedRegular[key]) {
      groupedRegular[key] = { batch: parsed.batch, caseNum: parsed.caseNum, in: null, out: null };
    }
    groupedRegular[key][parsed.ext] = parsed.originalFile;
  });

  sampleFiles.forEach(parsed => {
    const key = `${parsed.batch || 'none'}-${parsed.caseNum}`;
    if (!groupedSamples[key]) {
      groupedSamples[key] = { batch: parsed.batch, caseNum: parsed.caseNum, in: null, out: null };
    }
    groupedSamples[key][parsed.ext] = parsed.originalFile;
  });

  // Sort test cases by batch then case number
  const sortTestCases = (grouped) => {
    return Object.values(grouped)
      .filter(tc => tc.in && tc.out) // Only complete pairs
      .sort((a, b) => {
        // Sort by batch first
        const batchA = a.batch === 'sample' ? 999 : (a.batch ? parseInt(a.batch) : 0);
        const batchB = b.batch === 'sample' ? 999 : (b.batch ? parseInt(b.batch) : 0);
        if (batchA !== batchB) return batchA - batchB;

        // Then by case number
        const numA = parseInt(a.caseNum);
        const numB = parseInt(b.caseNum);
        return numA - numB;
      });
  };

  const sortedRegular = sortTestCases(groupedRegular);
  const sortedSamples = sortTestCases(groupedSamples);

  // Limit regular test cases to MAX_TEST_CASES
  const limitedRegular = sortedRegular.slice(0, MAX_TEST_CASES);

  // Renumber sequentially starting from 1
  const renumberedRegular = limitedRegular.map((tc, idx) => ({
    newNum: idx + 1,
    inFile: tc.in,
    outFile: tc.out
  }));

  // Renumber samples starting from 1
  const renumberedSamples = sortedSamples.map((tc, idx) => ({
    newNum: idx + 1,
    inFile: tc.in,
    outFile: tc.out
  }));

  return {
    regular: renumberedRegular,
    samples: renumberedSamples,
    totalSource: sortedRegular.length,
    truncated: sortedRegular.length > MAX_TEST_CASES
  };
}

function convertProblem(year, problemCode, sourceDir) {
  const destDir = path.join(DEST_ROOT, String(year), problemCode, 'test_data');

  // Create destination directory
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // Collect and renumber test cases
  const { regular, samples, totalSource, truncated } = collectAndRenumberTestCases(sourceDir);

  // Copy regular test cases with sequential numbering
  regular.forEach(({ newNum, inFile, outFile }) => {
    const destIn = path.join(destDir, `${problemCode}.${newNum}.in`);
    const destOut = path.join(destDir, `${problemCode}.${newNum}.out`);
    fs.copyFileSync(inFile, destIn);
    fs.copyFileSync(outFile, destOut);
  });

  // Copy sample files (separate from regular test cases)
  samples.forEach(({ newNum, inFile, outFile }) => {
    const destIn = path.join(destDir, `${problemCode}.sample.${newNum}.in`);
    const destOut = path.join(destDir, `${problemCode}.sample.${newNum}.out`);
    fs.copyFileSync(inFile, destIn);
    fs.copyFileSync(outFile, destOut);
  });

  const statusMsg = truncated
    ? `${regular.length}/${totalSource} (truncated from ${totalSource})`
    : `${regular.length}`;

  const sampleMsg = samples.length > 0 ? ` + ${samples.length} samples` : '';

  console.log(`${problemCode.toUpperCase()}: ${statusMsg} test cases${sampleMsg}`);
}

function convertYear(year) {
  console.log(`\nProcessing ${year}...`);

  for (const [divName, divCode] of Object.entries(DIVISIONS)) {
    const sourceDir = path.join(SOURCE_ROOT, `${year}CCC${divName}TestData`);

    if (!fs.existsSync(sourceDir)) {
      console.log(`${divName} division not found, skipping...`);
      continue;
    }

    console.log(`Processing ${divName} division...`);

    // Process standard problems (j1-j5 or s1-s5)
    for (let problemNum = 1; problemNum <= 5; problemNum++) {
      const problemCode = `${divCode}${problemNum}`;
      const sourceProblemDir = path.join(sourceDir, problemCode);

      if (!fs.existsSync(sourceProblemDir)) {
        console.log(`${problemCode.toUpperCase()} not found, skipping...`);
        continue;
      }

      convertProblem(year, problemCode, sourceProblemDir);
    }

    // Handle cross-division problems (e.g., s2_j5, j5_s2, s1_j4, s2j4, s1j4, J4S2)
    const allFolders = fs.readdirSync(sourceDir);
    const crossDivisionFolders = allFolders.filter(folder => {
      // Match both formats: s1_j4 (with underscore) OR s1j4 (no separator)
      // Case-insensitive to handle J4S2, etc.
      return /^[js]\d+_?[js]\d+$/i.test(folder) && folder !== `${divCode}1` && folder !== `${divCode}2` && folder !== `${divCode}3` && folder !== `${divCode}4` && folder !== `${divCode}5`;
    });

    crossDivisionFolders.forEach(folder => {
      // Extract both problem codes from cross-division folder
      // Parse: "s2_j5", "j5_s2", "s2j4", "j4s2", "J4S2" -> extract BOTH parts
      const match = folder.match(/^([js]\d+)_?([js]\d+)$/i);
      if (!match) return;

      const [, part1, part2] = match;
      const sourceProblemDir = path.join(sourceDir, folder);

      // Convert for BOTH problem codes (e.g., j5_s2 should create both j5 AND s2)
      // Normalize to lowercase for problem codes
      [part1.toLowerCase(), part2.toLowerCase()].forEach(code => {
        console.log(`${folder} -> ${code.toUpperCase()} (cross-division)`);
        convertProblem(year, code, sourceProblemDir);
      });
    });
  }
}

function main() {
  console.log('Starting test case conversion (Sequential Renumbering)...\n');
  console.log(`Source: ${SOURCE_ROOT}`);
  console.log(`Destination: ${DEST_ROOT}`);
  console.log(`Max test cases per problem: ${MAX_TEST_CASES}\n`);

  if (!fs.existsSync(SOURCE_ROOT)) {
    console.error(`\nERROR: Source directory not found: ${SOURCE_ROOT}`);
    process.exit(1);
  }

  let totalYears = 0;
  for (const year of YEARS) {
    try {
      convertYear(year);
      totalYears++;
    } catch (error) {
      console.error(`\nError processing ${year}:`, error.message);
      console.error(error.stack);
    }
  }

  console.log(`\nConversion complete: Processed ${totalYears}/${YEARS.length} years.`);
}

main();