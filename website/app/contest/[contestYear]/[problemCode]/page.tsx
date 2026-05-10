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
} from '@radix-ui/react-icons';
import { Card, CardContent } from '../../../../components/ui/card';
import { SectionContainer } from '../../../../components/ui/section-container';
import { Problem as ProblemType, problems } from '../../../../constants';
import dynamic from 'next/dynamic';

const SyntaxHighlighter = dynamic(() => import('react-syntax-highlighter').then(mod => mod.Prism), {
  ssr: false,
  loading: () => <div className="p-4 text-foreground-lighter">Loading code…</div>
});

interface TestCaseData {
  input: string | null;
  output: string | null;
}

interface TestCaseSize {
  inputKB: number;
  outputKB: number;
}

const Problem = () => {
  const { contestYear, problemCode } = useParams<{
    contestYear: string;
    problemCode: string;
  }>();
  const [solutions, setSolutions] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<number | null>(null);
  const [testCaseData, setTestCaseData] = useState<TestCaseData>({ input: '', output: '' });
  const [testCaseState, setTestCaseState] = useState<'idle' | 'loading' | 'success' | 'error'>(
    'idle'
  );
  const [availableTestCases, setAvailableTestCases] = useState(10);
  const [testCaseSizes, setTestCaseSizes] = useState<Record<number, TestCaseSize>>({});
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
    const fetchSolutions = async () => {
      setLoading(true);
      const solutionsArray: string[] = [];
      const basePath = `/past_contests/${contestYear}/${problemCode}`;

      for (let i = 1; i <= 3; i++) {
        try {
          const fetchUrl = `${basePath}/solution${i === 1 ? '' : i}.txt`;
          const response = await fetch(fetchUrl);

          if (!response.ok) continue;
          const text = await response.text();

          if (!text.toLowerCase().includes('<!doctype html>')) {
            solutionsArray.push(text);
          }
        } catch (error) {
          console.error(`Error fetching solution${i}:`, error);
        }
      }

      if (solutionsArray.length > 0) {
        setSolutions(solutionsArray);
      } else {
        setSolutions([
          'Solution does not currently exist. If you have a solution, please upload your solution along with a commented explanation on our forum. Thank you!',
        ]);
      }
      setLoading(false);
    };

    fetchSolutions();
  }, [contestYear, problemCode]);

  useEffect(() => {
    if (problemInfo) {
      document.title = problemInfo.name;
      return () => {
        document.title = 'CCCSolutions';
      };
    }
  }, [problemInfo]);

  const fetchTestCase = async (idx: number) => {
    setTestCaseState('loading');
    setTestCaseData({ input: '', output: '' });
    const basePath = `/past_contests/${contestYear}/${problemCode}/test_data`;
    const caseNum = idx + 1;

    try {
      const inputResponse = await fetch(`${basePath}/${problemCode}.${caseNum}.in`);
      const outputResponse = await fetch(`${basePath}/${problemCode}.${caseNum}.out`);

      if (!inputResponse.ok || !outputResponse.ok) {
        setTestCaseState('error');
        setTestCaseData({
          input: inputResponse.ok ? await inputResponse.text() : null,
          output: outputResponse.ok ? await outputResponse.text() : null,
        });
        return;
      }

      const inputText = await inputResponse.text();
      const outputText = await outputResponse.text();

      if (
        inputText.toLowerCase().includes('<!doctype html>') ||
        outputText.toLowerCase().includes('<!doctype html>')
      ) {
        setTestCaseState('error');
        setTestCaseData({ input: null, output: null });
        return;
      }

      setTestCaseData({ input: inputText, output: outputText });
      setTestCaseState('success');
    } catch (error) {
      console.error(`Error fetching test case ${caseNum}:`, error);
      setTestCaseState('error');
      setTestCaseData({ input: null, output: null });
    }
  };

  const handleTabClick = (idx: number) => {
    setActiveTab(idx);
    fetchTestCase(idx);
  };

  useEffect(() => {
    const checkTestCases = async () => {
      const basePath = `/past_contests/${contestYear}/${problemCode}/test_data`;
      let count = 0;
      const sizes: Record<number, TestCaseSize> = {};

      for (let i = 1; i <= 20; i++) {
        try {
          const inputResponse = await fetch(`${basePath}/${problemCode}.${i}.in`);
          if (inputResponse.ok) {
            const inputText = await inputResponse.text();
            if (!inputText.toLowerCase().includes('<!doctype html>')) {
              count = i;
              const inputKB = (inputText.length / 1024).toFixed(1);

              try {
                const outputResponse = await fetch(`${basePath}/${problemCode}.${i}.out`);
                if (outputResponse.ok) {
                  const outputText = await outputResponse.text();
                  const outputKB = (outputText.length / 1024).toFixed(1);
                  sizes[i] = {
                    inputKB: parseFloat(inputKB),
                    outputKB: parseFloat(outputKB),
                  };
                }
              } catch {
                sizes[i] = { inputKB: parseFloat(inputKB), outputKB: 0 };
              }
            } else {
              break;
            }
          } else {
            break;
          }
        } catch {
          break;
        }
      }

      setAvailableTestCases(count > 0 ? count : 10);
      setTestCaseSizes(sizes);
    };

    checkTestCases();
  }, [contestYear, problemCode]);

  const getFileSizeWarning = (text: string | null) => {
    if (!text) return null;
    const sizeKB = parseFloat((text.length / 1024).toFixed(1));
    return sizeKB > 50 ? `Large file (${sizeKB}KB)` : null;
  };

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
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 evil-purple-glow';
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
            author: { '@type': 'Organization', name: 'CCC Solutions Community' },
            publisher: {
              '@type': 'Organization',
              name: 'CCC Solutions',
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
                : `${solutions.length} Solution${solutions.length !== 1 ? 's' : ''} available`}
            </h2>
          </div>

          {loading ? (
            <div className="animate-pulse">
              <div className="h-64 bg-surface-200 rounded-lg" />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {solutions.map((solution, idx) => (
                <Card key={idx} className="overflow-hidden">
                  <div className="bg-surface-200 px-4 py-2 flex justify-between items-center border-b border-border-default">
                    <h3 className="font-medium text-foreground-light text-sm">
                      Solution {idx + 1}
                    </h3>
                    <span className="text-xs font-medium text-foreground-lighter uppercase">
                      {getLanguageFromCode(solution)}
                    </span>
                  </div>
                  <SyntaxHighlighter
                    language={getLanguageFromCode(solution)}
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
                    {solution}
                  </SyntaxHighlighter>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Test cases section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <FileTextIcon width="18" height="18" className="text-brand" />
            <h2 className="text-xl font-semibold text-foreground">Test cases</h2>
          </div>

          <Card>
            {/* Tab strip */}
            <div className="flex items-center p-3 border-b border-border-default overflow-x-auto">
              {Array.from({ length: availableTestCases }, (_, idx) => (
                <button
                  key={idx}
                  onClick={() => handleTabClick(idx)}
                  className={`px-3 py-1 mr-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                    activeTab === idx
                      ? 'bg-brand-500 text-white'
                      : 'bg-surface-200 text-foreground-light hover:bg-surface-300 hover:text-foreground'
                  }`}
                >
                  Case {idx + 1}
                </button>
              ))}
            </div>

            <div className="p-4">
              {activeTab === null ? (
                <div className="text-center py-8 text-foreground-lighter text-sm">
                  Select a test case to view input and output
                </div>
              ) : testCaseState === 'loading' ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full size-8 border-b-2 border-brand" />
                  {(() => {
                    const caseNum = activeTab + 1;
                    const sizes = testCaseSizes[caseNum];
                    if (sizes) {
                      const maxSize = Math.max(sizes.inputKB, sizes.outputKB);
                      if (maxSize > 50) {
                        const sizeDisplay =
                          maxSize > 1024
                            ? `${(maxSize / 1024).toFixed(1)}MB`
                            : `${maxSize.toFixed(1)}KB`;
                        return (
                          <div>
                            <p className="mt-2 text-foreground-light">
                              Loading large test case ({sizeDisplay})…
                            </p>
                            <p className="mt-1 text-sm text-warning">
                              ⚠️ This may take a moment
                            </p>
                          </div>
                        );
                      }
                    }
                    return (
                      <p className="mt-2 text-foreground-light">Loading test case…</p>
                    );
                  })()}
                </div>
              ) : testCaseState === 'error' ? (
                <div className="flex items-center justify-center py-8 text-destructive">
                  <InfoCircledIcon width="20" height="20" className="mr-2" />
                  <p className="font-medium">
                    Test case not available. See GitHub repo for test data.
                  </p>
                </div>
              ) : testCaseState === 'success' ? (
                <div>
                  {(getFileSizeWarning(testCaseData.input) ||
                    getFileSizeWarning(testCaseData.output)) && (
                    <div className="mb-4 p-3 bg-warning-200 border border-warning-400 rounded-md">
                      <p className="text-sm text-warning-600">
                        ⚠️{' '}
                        {getFileSizeWarning(testCaseData.input) ||
                          getFileSizeWarning(testCaseData.output)}{' '}
                        , may load slowly
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium text-foreground-light mb-2 text-sm">
                        Input
                        {getFileSizeWarning(testCaseData.input) && (
                          <span className="text-xs text-foreground-lighter ml-2">
                            ({(testCaseData.input!.length / 1024).toFixed(1)}KB)
                          </span>
                        )}
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
                        {getFileSizeWarning(testCaseData.output) && (
                          <span className="text-xs text-foreground-lighter ml-2">
                            ({(testCaseData.output!.length / 1024).toFixed(1)}KB)
                          </span>
                        )}
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
    </div>
  );
};

export default Problem;
