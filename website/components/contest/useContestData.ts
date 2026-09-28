'use client';

import { useEffect, useState } from 'react';
import {
  fetchContestList,
  fetchContestPreview,
  type ContestListResponse,
  type ContestSolutionMeta,
  type ContestTestMeta,
} from '../../lib/contest-api';

export type ListStatus = 'loading' | 'invalid' | 'error' | 'ok';
export type LoadState = 'idle' | 'loading' | 'success' | 'error';

export interface SolutionEntry extends ContestSolutionMeta {
  code: string;
  language: string;
}

export interface TestCaseData {
  input: string | null;
  output: string | null;
}

export const LARGE_FILE_BYTES = 50 * 1024;

export const formatSize = (bytes: number) =>
  bytes > 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)}MB`
    : `${(bytes / 1024).toFixed(1)}KB`;

const testFilePath = (test: ContestTestMeta, kind: 'in' | 'out') =>
  `${test.sample ? 'tests/sample' : 'tests'}/${test.n}.${kind}`;

function getLanguageFromCode(code: string) {
  const trimmedCode = code.trim();

  if (
    /^var\s+\w+\s*:/m.test(code) ||
    /\bput\s+/.test(code) ||
    /\bget\s+/.test(code) ||
    /^loop\s*$/m.test(code) ||
    /\bend\s+loop/m.test(code) ||
    /\b:=\b/.test(code)
  ) {
    return 'turing';
  }

  if (
    /#include\s*</.test(code) ||
    /using\s+namespace\s+std/.test(code) ||
    /std::/.test(code) ||
    /\bcin\s*>>/.test(code) ||
    /\bcout\s*<</.test(code) ||
    /vector</.test(code) ||
    /int\s+main\s*\(/m.test(code)
  ) {
    return 'cpp';
  }

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
  ) {
    return 'java';
  }

  if (
    /^(import|from) \w+/m.test(trimmedCode) ||
    /^def \w+\s*\(/m.test(trimmedCode) ||
    /^class \w+:/m.test(trimmedCode) ||
    /input\(\)/.test(code) ||
    /print\(/.test(code) ||
    /\brange\(/.test(code) ||
    /__name__/.test(code) ||
    /\.readline\(\)/.test(code) ||
    /\.append\(/.test(code) ||
    /\beval\(/.test(code) ||
    /^#\s*[A-Z]/.test(trimmedCode) ||
    /\bfor\s+\w+\s+in\s+/.test(code) ||
    /\bif\s+.*:\s*$/m.test(code)
  ) {
    return 'python';
  }

  if (/\bpublic\b|\bprivate\b|\bprotected\b/.test(code)) return 'java';

  return 'cpp';
}

function extToLanguage(ext: string, code: string) {
  switch (ext) {
    case 'py':
      return 'python';
    case 'cpp':
      return 'cpp';
    case 'java':
      return 'java';
    case 't':
      return 'turing';
    default:
      return getLanguageFromCode(code);
  }
}

// Loads the file list and every solution's code once, for both the Classic and New views.
export function useContestData(contestYear: string, problemCode: string) {
  const [listStatus, setListStatus] = useState<ListStatus>('loading');
  const [loading, setLoading] = useState(true);
  const [tests, setTests] = useState<ContestTestMeta[]>([]);
  const [solutionsMeta, setSolutionsMeta] = useState<ContestSolutionMeta[]>([]);
  const [solutions, setSolutions] = useState<SolutionEntry[]>([]);
  const [solutionsError, setSolutionsError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const loadContest = async () => {
      setLoading(true);
      setListStatus('loading');
      setSolutionsError(false);
      setTests([]);
      setSolutionsMeta([]);
      setSolutions([]);

      try {
        const res = await fetchContestList(contestYear, problemCode, signal);

        // 400 means the year/code itself is invalid (e.g. j8, or a s/j code
        // before 2000). That is a different situation from a real API failure.
        if (res.status === 400) {
          setListStatus('invalid');
          return;
        }
        if (!res.ok) throw new Error(`list ${res.status}`);
        const data: ContestListResponse = await res.json();
        if (signal.aborted) return;

        // Show sample cases first, then graded. Each group goes by ascending n.
        const listTests = [...(data.tests ?? [])].sort(
          (a, b) => Number(b.sample) - Number(a.sample) || a.n - b.n
        );
        const listSolutions = [...(data.solutions ?? [])].sort((a, b) => a.n - b.n);
        setTests(listTests);
        setSolutionsMeta(listSolutions);
        setListStatus('ok');

        const solutionEntries = await Promise.all(
          listSolutions.map(async (s): Promise<SolutionEntry | null> => {
            try {
              const sres = await fetchContestPreview(
                contestYear,
                problemCode,
                `solutions/${s.n}.${s.ext}`,
                signal
              );
              if (!sres.ok) return null;
              const code = await sres.text();
              return { ...s, code, language: extToLanguage(s.ext, code) };
            } catch (error) {
              if (!signal.aborted) console.error(`Error fetching solution ${s.n}:`, error);
              return null;
            }
          })
        );
        if (signal.aborted) return;

        const validSolutions = solutionEntries.filter((e): e is SolutionEntry => e !== null);
        setSolutions(validSolutions);
        // Solutions exist server-side but every fetch for them failed.
        setSolutionsError(validSolutions.length === 0 && listSolutions.length > 0);
      } catch (error) {
        if (signal.aborted) return;
        console.error('Error loading contest data:', error);
        setListStatus('error');
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    };

    loadContest();
    return () => controller.abort();
  }, [contestYear, problemCode]);

  return { listStatus, loading, tests, solutionsMeta, solutions, solutionsError };
}

export function useTestCase(
  contestYear: string,
  problemCode: string,
  test: ContestTestMeta | null
) {
  const [data, setData] = useState<TestCaseData>({ input: '', output: '' });
  const [state, setState] = useState<LoadState>('idle');

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    if (!test) {
      setData({ input: '', output: '' });
      setState('idle');
      return () => controller.abort();
    }

    const loadTest = async () => {
      setState('loading');
      setData({ input: '', output: '' });
      try {
        const [inputResponse, outputResponse] = await Promise.all([
          fetchContestPreview(contestYear, problemCode, testFilePath(test, 'in'), signal),
          fetchContestPreview(contestYear, problemCode, testFilePath(test, 'out'), signal),
        ]);
        if (signal.aborted) return;
        if (!inputResponse.ok && !outputResponse.ok) {
          setData({ input: null, output: null });
          setState('error');
          return;
        }
        const [input, output] = await Promise.all([
          inputResponse.ok ? inputResponse.text() : null,
          outputResponse.ok ? outputResponse.text() : null,
        ]);
        if (signal.aborted) return;
        setData({ input, output });
        setState('success');
      } catch (error) {
        if (signal.aborted) return;
        console.error(`Error fetching test case ${test.n}:`, error);
        setData({ input: null, output: null });
        setState('error');
      }
    };

    loadTest();
    return () => controller.abort();
  }, [contestYear, problemCode, test]);

  return { data, state };
}
