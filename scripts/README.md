# Test Case Conversion Script

## Purpose
Converts 2016-2024 test cases from various formats to the standardized format used by the website.

## Format Conversion

The script handles **three different formats** found in the 2016+ test data:

### Format 1: Dash Batches (2023-2024 Senior)
**FROM:**
```
/2016+ test cases/2024CCCSeniorTestData/s1/
  s1.1-03.in   ← Multiple batches per test case
  s1.1-04.in
  s1.1-05.in
  s1.2-08.in
  ...
```
**TO:**
```
/website/public/past_contests/2024/s1/test_data/
  s1.1.in   ← First batch only
  s1.1.out
  s1.2.in
  s1.2.out
  ...
```

### Format 2: Triple Dots (2020 j1)
**FROM:**
```
/2016+ test cases/2020CCCJuniorTestData/j1/
  j1.01.01.in   ← Test case 1, batch 1
  j1.01.02.in   ← Test case 1, batch 2
  j1.02.01.in   ← Test case 2, batch 1
  ...
```
**TO:**
```
/website/public/past_contests/2020/j1/test_data/
  j1.01.in   ← First batch only
  j1.01.out
  j1.02.in
  j1.02.out
  ...
```

### Format 3: Standard (2016-2022 most problems)
**FROM:**
```
/2016+ test cases/2019CCCJuniorTestData/j1/
  j1.01.in   ← Already standard
  j1.01.out
  j1.02.in
  ...
```
**TO:**
```
/website/public/past_contests/2019/j1/test_data/
  j1.01.in   ← Copied as-is
  j1.01.out
  j1.02.in
  ...
```

## Usage

### Run the conversion:
```bash
cd scripts
node convert-test-cases.js
```

### What it does:
1. Reads from `2016+ test cases/` in repo root
2. Detects which format each file uses (dash batches, triple dots, or standard)
3. For batched formats: Extracts first batch only (e.g., keeps `s1.1-03.in`, skips `s1.1-04.in`)
4. For standard format: Copies as-is
5. Copies to `website/public/past_contests/{year}/{problem}/test_data/`
6. Renames to standard format: `{problem}.{num}.in`
7. Skips sample files and README files automatically

### After running:
1. Check output in terminal for any errors
2. Test a few problems in your browser
3. Commit the new `test_data` folders:
   ```bash
   git add website/public/past_contests/
   git commit -m "Add 2016-2024 test cases"
   ```

## Troubleshooting

**Error: Source directory not found**
- Make sure `2016+ test cases` folder exists in repo root
- Check that it contains folders like `2024CCCSeniorTestData`

**Files not showing up on website**
- Clear browser cache
- Check that files are in correct location
- Verify file naming matches pattern: `{problem}.{num}.in`

**Missing test cases for some problems**
- Some problems may not have test data in source folder
- Script will skip and report these
