'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  InfoCircledIcon,
  CodeIcon,
  FileTextIcon,
  ArrowLeftIcon,
  DownloadIcon,
  ExclamationTriangleIcon,
} from '@radix-ui/react-icons';
import { toast } from 'sonner';
import { Card, CardContent } from '../../../../components/ui/card';
import { SectionContainer } from '../../../../components/ui/section-container';
import { DownloadDialog } from '../../../../components/contest/DownloadDialog';
import { Problem as ProblemType, problems } from '../../../../constants';
import dynamic from 'next/dynamic';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.cccsolutions.ca';
const LARGE_FILE_BYTES = 50 * 1024;

const SyntaxHighlighter = dynamic(
  () => import('react-syntax-highlighter').then((mod) => mod.Prism),
  {
    ssr: false,
    loading: () => <div className="p-4 text-foreground-lighter">Loading code…</div>,
  }
);

interface TestCaseData {
  input: string | null;
  output: string | null;
}

interface TestMeta {
  n: number;
  sample: boolean;
  inputBytes: number;
  outputBytes: number;
}

interface SolutionMeta {
  n: number;
  ext: string;
  bytes: number;
}

interface SolutionEntry {
  code: string;
  language: string;
  n: number;
  ext: string;
}

interface ListResponse {
  tests: TestMeta[];
  solutions: SolutionMeta[];
}

const SOLUTION_MISSING_MESSAGE =
  'Solution does not currently exist. If you have a solution, please upload your solution along with a commented explanation on our forum. Thank you!';

const SOLUTION_ERROR_MESSAGE =
  'Unable to load solutions right now. The API may be temporarily unavailable, please try again shortly.';

const PROBLEM_INVALID_MESSAGE =
  'This problem does not exist. Double check the year and problem code.';

const PROBLEM_ERROR_MESSAGE =
  'Unable to load this problem right now. The API may be temporarily unavailable, please try again shortly.';

const formatSize = (bytes: number) =>
  bytes > 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)}MB`
    : `${(bytes / 1024).toFixed(1)}KB`;

const Problem = () => {
  const { contestYear, problemCode } = useParams<{
    contestYear: string;
    problemCode: string;
  }>();
  const [solutions, setSolutions] = useState<SolutionEntry[]>([]);
  const [solutionsError, setSolutionsError] = useState(false);
  const [listStatus, setListStatus] = useState<'loading' | 'invalid' | 'error' | 'ok'>('loading');
  const [activeTab, setActiveTab] = useState<number | null>(null);
  const [testCaseData, setTestCaseData] = useState<TestCaseData>({ input: '', output: '' });
  const [testCaseState, setTestCaseState] = useState<'idle' | 'loading' | 'success' | 'error'>(
    'idle'
  );
  const [tests, setTests] = useState<TestMeta[]>([]);
  const [solutionsMeta, setSolutionsMeta] = useState<SolutionMeta[]>([]);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [problemInfo, setProblemInfo] = useState<ProblemType | null>(null);
  const [loading, setLoading] = useState(true);

  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const codeStyle = mounted && resolvedTheme === 'dark' ? oneDark : oneLight;

  useEffect(() => {
    const fetchProblemInfo = async () => {
      try {
        const problemData = problems.find(
          (p) => p.link === `/contest/${contestYear}/${problemCode}`
        );
        setProblemInfo(problemData || null);
      } catch (error) {
        console.error('Error fetching problem info:', error);
        setProblemInfo({
          name: `${contestYear} ${(problemCode as string).toUpperCase()}`,
          difficulty: 'Unknown',
          tags: [],
          link: '',
          hasSolution: false,
        });
      }
    };

    fetchProblemInfo();
  }, [contestYear, problemCode]);

  useEffect(() => {
    let cancelled = false;

    const extToLanguage = (ext: string, code: string) => {
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
    };

    const loadContest = async () => {
      setLoading(true);
      setActiveTab(null);
      setTestCaseState('idle');
      setSolutionsError(false);
      setListStatus('loading');

      try {
        const res = await fetch(`${API_BASE}/contests/${contestYear}/${problemCode}/list`);

        // 400 means the year/code itself is invalid (e.g. j8, or a s/j code
        // before 2000) — a different situation from a real API failure.
        if (res.status === 400) {
          if (cancelled) return;
          setTests([]);
          setSolutionsMeta([]);
          setSolutions([]);
          setListStatus('invalid');
          return;
        }
        if (!res.ok) throw new Error(`list ${res.status}`);
        const data: ListResponse = await res.json();
        if (cancelled) return;
        setListStatus('ok');

        // Show sample cases first, then graded — each group by ascending n.
        const listTests = [...(data.tests ?? [])].sort(
          (a, b) => Number(b.sample) - Number(a.sample) || a.n - b.n
        );
        setTests(listTests);
        setSolutionsMeta([...(data.solutions ?? [])].sort((a, b) => a.n - b.n));

        const solutionEntries = await Promise.all(
          (data.solutions ?? []).map(async (s) => {
            try {
              const sres = await fetch(
                `${API_BASE}/contests/${contestYear}/${problemCode}/preview?file=solutions/${s.n}.${s.ext}`
              );
              if (!sres.ok) return null;
              const code = await sres.text();
              return { code, language: extToLanguage(s.ext, code), n: s.n, ext: s.ext };
            } catch (error) {
              console.error(`Error fetching solution ${s.n}:`, error);
              return null;
            }
          })
        );
        if (cancelled) return;

        const validSolutions = solutionEntries.filter(
          (e): e is NonNullable<typeof e> => e !== null
        );
        const attemptedCount = (data.solutions ?? []).length;

        if (validSolutions.length > 0) {
          setSolutions(validSolutions);
        } else if (attemptedCount === 0) {
          // API responded fine, there just isn't a solution uploaded yet.
          setSolutions([]);
        } else {
          // Solutions exist server-side but every fetch for them failed.
          setSolutions([]);
          setSolutionsError(true);
          toast.error('Unable to load solutions. The API may be temporarily unavailable.');
        }
      } catch (error) {
        console.error('Error loading contest data:', error);
        if (cancelled) return;
        setTests([]);
        setSolutionsMeta([]);
        setSolutions([]);
        setListStatus('error');
        toast.error('Unable to load this problem. The API may be temporarily unavailable.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadContest();
    return () => {
      cancelled = true;
    };
  }, [contestYear, problemCode]);

  const testFilePath = (test: TestMeta, kind: 'in' | 'out') =>
    `${test.sample ? 'tests/sample' : 'tests'}/${test.n}.${kind}`;

  const downloadUrl = (relpath: string) =>
    `${API_BASE}/contests/${contestYear}/${problemCode}/download?file=${relpath}`;

  const fetchTestCase = async (idx: number) => {
    const test = tests[idx];
    if (!test) return;
    setTestCaseState('loading');
    setTestCaseData({ input: '', output: '' });

    const base = `${API_BASE}/contests/${contestYear}/${problemCode}/preview`;

    try {
      const [inputResponse, outputResponse] = await Promise.all([
        fetch(`${base}?file=${testFilePath(test, 'in')}`),
        fetch(`${base}?file=${testFilePath(test, 'out')}`),
      ]);

      if (!inputResponse.ok && !outputResponse.ok) {
        setTestCaseState('error');
        setTestCaseData({ input: null, output: null });
        return;
      }

      setTestCaseData({
        input: inputResponse.ok ? await inputResponse.text() : null,
        output: outputResponse.ok ? await outputResponse.text() : null,
      });
      setTestCaseState('success');
    } catch (error) {
      console.error(`Error fetching test case ${test.n}:`, error);
      setTestCaseState('error');
      setTestCaseData({ input: null, output: null });
    }
  };

  const handleTabClick = (idx: number) => {
    setActiveTab(idx);
    fetchTestCase(idx);
  };

  const getFileSizeWarning = (bytes: number | undefined) =>
    bytes && bytes > LARGE_FILE_BYTES ? `Large file (${formatSize(bytes)})` : null;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'normal':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'hard':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'insane':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'wicked':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      default:
        return 'bg-surface-200 text-foreground-light';
    }
  };

  const getLanguageFromCode = (code: string) => {
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
  };

  const activeTest = activeTab !== null ? (tests[activeTab] ?? null) : null;

  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* SEO structured data — escape "<" to prevent breaking out of the <script> tag */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://cccsolutions.ca' },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Solutions',
                item: 'https://cccsolutions.ca/solutions',
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: `CCC ${contestYear}`,
                item: `https://cccsolutions.ca/solutions?year=${contestYear}`,
              },
              {
                '@type': 'ListItem',
                position: 4,
                name: problemInfo?.name || `${contestYear} ${problemCode.toUpperCase()}`,
              },
            ],
          }).replace(/</g, '\\u003c'),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'TechArticle',
            headline:
              problemInfo?.name || `CCC ${contestYear} ${problemCode.toUpperCase()} Solution`,
            description: `Solution to ${
              problemInfo?.name || `CCC ${contestYear} ${problemCode.toUpperCase()}`
            } from the Canadian Computing Competition`,
            author: { '@type': 'Organization', name: 'CCCSolutions Community' },
            publisher: {
              '@type': 'Organization',
              name: 'CCCSolutions',
              logo: { '@type': 'ImageObject', url: 'https://cccsolutions.ca/icon.png' },
            },
            datePublished: `${contestYear}-02-01`,
            dateModified: `${contestYear}-02-01`,
            proficiencyLevel: problemInfo?.difficulty || 'Intermediate',
            dependencies: problemInfo?.tags?.join(', ') || 'algorithms',
          }).replace(/</g, '\\u003c'),
        }}
      />

      <SectionContainer size="large" className="pt-12 pb-20">
        {/* Back link */}
        <Link
          href="/solutions"
          className="inline-flex items-center gap-1.5 text-sm text-foreground-light hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeftIcon width="14" height="14" />
          Back to solutions
        </Link>

        {/* Problem header */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
            {problemInfo?.name || `CCC ${contestYear} ${problemCode.toUpperCase()}`}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-4">
            {problemInfo?.difficulty && (
              <span
                className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(
                  problemInfo.difficulty
                )}`}
              >
                {problemInfo.difficulty}
              </span>
            )}
            {problemInfo?.tags?.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium bg-surface-200 text-foreground-light border border-border-default"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Solutions section */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <CodeIcon width="18" height="18" className="text-brand" />
            <h2 className="text-xl font-semibold text-foreground">
              {loading
                ? 'Loading solutions…'
                : listStatus === 'invalid'
                  ? 'Problem not found'
                  : listStatus === 'error' || solutionsError
                    ? 'Solutions unavailable'
                    : solutions.length === 0
                      ? 'No solution available yet'
                      : `${solutions.length} Solution${solutions.length !== 1 ? 's' : ''} available`}
            </h2>
          </div>

          {loading ? (
            <div className="animate-pulse">
              <div className="h-64 bg-surface-200 rounded-lg" />
            </div>
          ) : solutions.length === 0 ? (
            <Card>
              <div
                className={`flex items-center justify-center gap-2 py-8 ${
                  listStatus === 'error' || solutionsError
                    ? 'text-destructive'
                    : 'text-foreground-lighter'
                }`}
              >
                {listStatus === 'error' || solutionsError ? (
                  <ExclamationTriangleIcon width="18" height="18" />
                ) : (
                  <InfoCircledIcon width="18" height="18" />
                )}
                <p className="font-medium text-sm">
                  {listStatus === 'invalid'
                    ? PROBLEM_INVALID_MESSAGE
                    : listStatus === 'error'
                      ? PROBLEM_ERROR_MESSAGE
                      : solutionsError
                        ? SOLUTION_ERROR_MESSAGE
                        : SOLUTION_MISSING_MESSAGE}
                </p>
              </div>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {solutions.map((solution, idx) => (
                <Card key={idx} className="overflow-hidden">
                  <div className="bg-surface-200 px-4 py-2 flex justify-between items-center border-b border-border-default">
                    <h3 className="font-medium text-foreground-light text-sm">
                      Solution {idx + 1}
                    </h3>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-foreground-lighter uppercase">
                        {solution.language}
                      </span>
                      <a
                        href={downloadUrl(`solutions/${solution.n}.${solution.ext}`)}
                        className="text-foreground-lighter hover:text-brand transition-colors"
                        aria-label={`Download solution ${idx + 1}`}
                        title="Download solution"
                      >
                        <DownloadIcon width="15" height="15" />
                      </a>
                    </div>
                  </div>
                  <SyntaxHighlighter
                    language={solution.language}
                    style={codeStyle}
                    showLineNumbers
                    customStyle={{
                      margin: 0,
                      borderRadius: 0,
                      background: 'transparent',
                      fontSize: '13px',
                    }}
                    codeTagProps={{ style: { background: 'transparent' } }}
                    lineProps={{ style: { background: 'transparent' } }}
                  >
                    {solution.code}
                  </SyntaxHighlighter>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Test cases section */}
        <section>
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <FileTextIcon width="18" height="18" className="text-brand" />
              <h2 className="text-xl font-semibold text-foreground">Test cases</h2>
            </div>
            {(tests.length > 0 || solutionsMeta.length > 0) && (
              <button
                onClick={() => setDownloadOpen(true)}
                className="inline-flex items-center gap-1.5 text-sm text-foreground-light hover:text-foreground transition-colors"
                aria-label="Download test cases and solutions"
              >
                <DownloadIcon width="15" height="15" />
                Download
              </button>
            )}
          </div>

          <Card>
            {/* Tab strip */}
            {tests.length > 0 && (
              <div className="flex items-center p-3 border-b border-border-default overflow-x-auto">
                {tests.map((test, idx) => (
                  <button
                    key={`${test.sample ? 'sample' : 'case'}-${test.n}`}
                    onClick={() => handleTabClick(idx)}
                    className={`px-3 py-1 mr-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                      activeTab === idx
                        ? 'bg-brand-500 text-white'
                        : 'bg-surface-200 text-foreground-light hover:bg-surface-300 hover:text-foreground'
                    }`}
                  >
                    {test.sample ? `Sample ${test.n}` : `Case ${test.n}`}
                  </button>
                ))}
              </div>
            )}

            <div className="p-4">
              {listStatus === 'invalid' ? (
                <div className="flex items-center justify-center gap-2 py-8 text-foreground-lighter">
                  <InfoCircledIcon width="20" height="20" />
                  <p className="font-medium text-sm">{PROBLEM_INVALID_MESSAGE}</p>
                </div>
              ) : listStatus === 'error' ? (
                <div className="flex items-center justify-center gap-2 py-8 text-destructive">
                  <ExclamationTriangleIcon width="20" height="20" />
                  <p className="font-medium text-sm">{PROBLEM_ERROR_MESSAGE}</p>
                </div>
              ) : tests.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-destructive">
                  <InfoCircledIcon width="20" height="20" className="mr-2" />
                  <p className="font-medium">
                    Test case not available. See GitHub repo for test data.
                  </p>
                </div>
              ) : activeTab === null ? (
                <div className="text-center py-8 text-foreground-lighter text-sm">
                  Select a test case to view input and output
                </div>
              ) : testCaseState === 'loading' ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full size-8 border-4 border-surface-300 border-t-brand" />
                  {(() => {
                    if (activeTest) {
                      const maxBytes = Math.max(activeTest.inputBytes, activeTest.outputBytes);
                      if (maxBytes > LARGE_FILE_BYTES) {
                        return (
                          <div>
                            <p className="mt-2 text-foreground-light">
                              Loading large test case ({formatSize(maxBytes)})…
                            </p>
                            <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-warning">
                              <ExclamationTriangleIcon width="13" height="13" />
                              This may take a moment
                            </p>
                          </div>
                        );
                      }
                    }
                    return <p className="mt-2 text-foreground-light">Loading test case…</p>;
                  })()}
                </div>
              ) : testCaseState === 'error' ? (
                <div className="flex items-center justify-center py-8 text-destructive">
                  <InfoCircledIcon width="20" height="20" className="mr-2" />
                  <p className="font-medium">
                    Test case not available. See GitHub repo for test data.
                  </p>
                </div>
              ) : testCaseState === 'success' && activeTest ? (
                <div>
                  {(getFileSizeWarning(activeTest.inputBytes) ||
                    getFileSizeWarning(activeTest.outputBytes)) && (
                    <div className="mb-4 p-3 bg-warning-200 border border-warning-400 rounded-md">
                      <p className="flex items-start gap-1.5 text-sm text-warning-600">
                        <ExclamationTriangleIcon
                          width="14"
                          height="14"
                          className="mt-0.5 shrink-0"
                        />
                        <span>
                          {getFileSizeWarning(activeTest.inputBytes) ||
                            getFileSizeWarning(activeTest.outputBytes)}{' '}
                          — preview is truncated, use the Download button for the full file
                        </span>
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium text-foreground-light mb-2 text-sm">
                        Input
                        <span className="text-xs text-foreground-lighter ml-2">
                          ({formatSize(activeTest.inputBytes)})
                        </span>
                      </h3>
                      <textarea
                        className="w-full h-48 p-3 bg-surface-100 text-foreground border border-border-strong rounded-md resize-y font-mono text-sm focus:outline-none focus:border-brand-highlight"
                        readOnly
                        value={testCaseData.input || ''}
                      />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground-light mb-2 text-sm">
                        Output
                        <span className="text-xs text-foreground-lighter ml-2">
                          ({formatSize(activeTest.outputBytes)})
                        </span>
                      </h3>
                      <textarea
                        className="w-full h-48 p-3 bg-surface-100 text-foreground border border-border-strong rounded-md resize-y font-mono text-sm focus:outline-none focus:border-brand-highlight"
                        readOnly
                        value={testCaseData.output || ''}
                      />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </Card>
        </section>
      </SectionContainer>

      <DownloadDialog
        open={downloadOpen}
        onClose={() => setDownloadOpen(false)}
        apiBase={API_BASE}
        year={contestYear}
        code={problemCode}
        tests={tests}
        solutions={solutionsMeta}
      />
    </div>
  );
};

export default Problem;
