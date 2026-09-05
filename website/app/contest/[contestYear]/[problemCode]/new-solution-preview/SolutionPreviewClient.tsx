'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeftIcon,
  ChatBubbleIcon,
  CodeIcon,
  Cross2Icon,
  DownloadIcon,
  ExclamationTriangleIcon,
  FileTextIcon,
  InfoCircledIcon,
  ReaderIcon,
  ResetIcon,
} from '@radix-ui/react-icons';
import { Button } from '../../../../../components/ui/button';
import { DownloadDialog } from '../../../../../components/contest/DownloadDialog';
import { MarkdownPreview } from '../../../../../components/forum/MarkdownPreview';
import { problems } from '../../../../../constants';
import {
  CONTEST_API_BASE,
  contestDownloadUrl,
  fetchContestList,
  fetchContestPreview,
  type ContestListResponse,
  type ContestSolutionMeta,
  type ContestTestMeta,
} from '../../../../../lib/contest-api';
import ProblemPageClient from '../ProblemPageClient';
import { CommentableCode } from './CommentableCode';

type ViewMode = 'classic' | 'new';
type PanelName = 'editorial' | 'solution' | 'tests';
type LoadState = 'idle' | 'loading' | 'success' | 'error';
type ListState = 'loading' | 'invalid' | 'error' | 'ok';

type SolutionEntry = ContestSolutionMeta & {
  code: string;
  language: string;
};

type TestCaseData = {
  input: string | null;
  output: string | null;
};

const LARGE_FILE_BYTES = 50 * 1024;
const DEFAULT_LEFT_SIZE = 54;
const DEFAULT_SOLUTION_SIZE = 64;

const MOCK_EDITORIAL = [
  '# Intuition',
  '',
  'This is placeholder editorial content for the layout preview. Imagine that the key observation is that every customer consumes one ticket until the supply is exhausted.',
  '',
  'The useful quantity to track is the number of tickets remaining after processing each request. Once that value would become negative, the current request cannot be fulfilled.',
  '',
  '$$\\text{remaining} = T - \\sum_{i=1}^{k} r_i$$',
  '',
  '# Approach',
  '',
  '1. Read the initial number of available tickets.',
  '2. Process each request in order.',
  '3. Subtract a request only when enough tickets remain.',
  '4. Report the first request that cannot be fulfilled, or the final remaining amount.',
  '',
  '> Preview note: this prose is intentionally mocked. It exists to test hierarchy, scrolling, math, and code beside a real solution.',
  '',
  '# Complexity',
  '',
  '- Time complexity: $O(N)$',
  '- Space complexity: $O(1)$',
  '',
  '# Implementation notes',
  '',
  'Keep the running total in an integer large enough for the stated constraints. The loop should preserve input order because the first unfulfilled request matters.',
  '',
  '```cpp',
  'for (int request : requests) {',
  '    if (request > remaining) break;',
  '    remaining -= request;',
  '}',
  '```',
  '',
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. This final paragraph gives the preview enough length to demonstrate independent panel scrolling without pretending to be an official solution.',
].join('\n');

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const formatSize = (bytes: number) =>
  bytes > 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)}MB`
    : `${(bytes / 1024).toFixed(1)}KB`;

const testFilePath = (test: ContestTestMeta, kind: 'in' | 'out') =>
  `${test.sample ? 'tests/sample' : 'tests'}/${test.n}.${kind}`;

function languageFromExtension(ext: string): string {
  if (ext === 'py') return 'python';
  if (ext === 'java') return 'java';
  if (ext === 't') return 'turing';
  return 'cpp';
}

function languageLabel(language: string): string {
  if (language === 'cpp') return 'C++';
  if (language === 'python') return 'Python';
  if (language === 'java') return 'Java';
  if (language === 'turing') return 'Turing';
  return language.toUpperCase();
}

function difficultyClass(difficulty: string): string {
  switch (difficulty.toLowerCase()) {
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
}

export default function SolutionPreviewClient() {
  const [view, setView] = useState<ViewMode>('new');

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border-default bg-surface-100">
        <div className="mx-auto flex min-h-11 max-w-[1800px] items-center justify-between gap-3 px-4 py-1.5 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <span className="text-xs font-medium text-foreground-light">
              Solution layout preview
            </span>
            <span className="ml-2 hidden text-[11px] text-foreground-lighter sm:inline">
              Frontend-only experiment
            </span>
          </div>
          <div
            className="inline-flex shrink-0 rounded-md border border-border-default bg-background p-0.5"
            aria-label="Solution page layout"
          >
            {(['classic', 'new'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setView(option)}
                aria-pressed={view === option}
                className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                  view === option
                    ? 'bg-brand-500 text-white'
                    : 'text-foreground-light hover:bg-surface-200 hover:text-foreground'
                }`}
              >
                {option === 'classic' ? 'Classic' : 'New'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === 'classic' ? <ProblemPageClient /> : <WorkspaceView />}
    </div>
  );
}

function WorkspaceView() {
  const { contestYear, problemCode } = useParams<{
    contestYear: string;
    problemCode: string;
  }>();
  const problemInfo = useMemo(
    () => problems.find((problem) => problem.link === `/contest/${contestYear}/${problemCode}`),
    [contestYear, problemCode]
  );

  const [listState, setListState] = useState<ListState>('loading');
  const [tests, setTests] = useState<ContestTestMeta[]>([]);
  const [solutions, setSolutions] = useState<ContestSolutionMeta[]>([]);
  const [activeSolutionIndex, setActiveSolutionIndex] = useState<number | null>(null);
  const [activeTestIndex, setActiveTestIndex] = useState<number | null>(null);
  const [solutionEntry, setSolutionEntry] = useState<SolutionEntry | null>(null);
  const [solutionState, setSolutionState] = useState<LoadState>('idle');
  const [testData, setTestData] = useState<TestCaseData>({ input: '', output: '' });
  const [testState, setTestState] = useState<LoadState>('idle');
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [commentsVisible, setCommentsVisible] = useState(true);
  const [visible, setVisible] = useState<Record<PanelName, boolean>>({
    editorial: true,
    solution: true,
    tests: true,
  });
  const [leftSize, setLeftSize] = useState(DEFAULT_LEFT_SIZE);
  const [solutionSize, setSolutionSize] = useState(DEFAULT_SOLUTION_SIZE);
  const [mobilePanel, setMobilePanel] = useState<PanelName>('editorial');
  const desktopRef = useRef<HTMLDivElement>(null);
  const rightColumnRef = useRef<HTMLDivElement>(null);

  const activeSolution =
    activeSolutionIndex === null ? null : (solutions[activeSolutionIndex] ?? null);
  const activeTest = activeTestIndex === null ? null : (tests[activeTestIndex] ?? null);
  const rightVisible = visible.solution || visible.tests;

  useEffect(() => {
    const controller = new AbortController();

    const loadList = async () => {
      setListState('loading');
      setTests([]);
      setSolutions([]);
      setActiveSolutionIndex(null);
      setActiveTestIndex(null);
      try {
        const response = await fetchContestList(contestYear, problemCode, controller.signal);
        if (response.status === 400) {
          setListState('invalid');
          return;
        }
        if (!response.ok) throw new Error(`list ${response.status}`);
        const data = (await response.json()) as ContestListResponse;
        const orderedTests = [...(data.tests ?? [])].sort(
          (a, b) => Number(b.sample) - Number(a.sample) || a.n - b.n
        );
        const orderedSolutions = [...(data.solutions ?? [])].sort((a, b) => a.n - b.n);
        setTests(orderedTests);
        setSolutions(orderedSolutions);
        setActiveSolutionIndex(orderedSolutions.length ? 0 : null);
        setActiveTestIndex(orderedTests.length ? 0 : null);
        setListState('ok');
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Error loading contest data:', error);
        setListState('error');
      }
    };

    loadList();
    return () => controller.abort();
  }, [contestYear, problemCode]);

  useEffect(() => {
    const controller = new AbortController();
    if (!activeSolution) {
      setSolutionEntry(null);
      setSolutionState('idle');
      return () => controller.abort();
    }

    const loadSolution = async () => {
      setSolutionState('loading');
      setSolutionEntry(null);
      try {
        const response = await fetchContestPreview(
          contestYear,
          problemCode,
          `solutions/${activeSolution.n}.${activeSolution.ext}`,
          controller.signal
        );
        if (!response.ok) throw new Error(`solution ${response.status}`);
        const code = await response.text();
        if (controller.signal.aborted) return;
        setSolutionEntry({
          ...activeSolution,
          code,
          language: languageFromExtension(activeSolution.ext),
        });
        setSolutionState('success');
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Error loading solution:', error);
        setSolutionState('error');
      }
    };

    loadSolution();
    return () => controller.abort();
  }, [activeSolution, contestYear, problemCode]);

  useEffect(() => {
    const controller = new AbortController();
    if (!activeTest) {
      setTestData({ input: '', output: '' });
      setTestState('idle');
      return () => controller.abort();
    }

    const loadTest = async () => {
      setTestState('loading');
      setTestData({ input: '', output: '' });
      try {
        const [inputResponse, outputResponse] = await Promise.all([
          fetchContestPreview(
            contestYear,
            problemCode,
            testFilePath(activeTest, 'in'),
            controller.signal
          ),
          fetchContestPreview(
            contestYear,
            problemCode,
            testFilePath(activeTest, 'out'),
            controller.signal
          ),
        ]);
        if (controller.signal.aborted) return;
        if (!inputResponse.ok && !outputResponse.ok) {
          setTestData({ input: null, output: null });
          setTestState('error');
          return;
        }
        setTestData({
          input: inputResponse.ok ? await inputResponse.text() : null,
          output: outputResponse.ok ? await outputResponse.text() : null,
        });
        setTestState('success');
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Error loading test case:', error);
        setTestData({ input: null, output: null });
        setTestState('error');
      }
    };

    loadTest();
    return () => controller.abort();
  }, [activeTest, contestYear, problemCode]);

  const togglePanel = (panel: PanelName) => {
    setVisible((current) => ({ ...current, [panel]: !current[panel] }));
  };

  const resetLayout = () => {
    setVisible({ editorial: true, solution: true, tests: true });
    setLeftSize(DEFAULT_LEFT_SIZE);
    setSolutionSize(DEFAULT_SOLUTION_SIZE);
    setMobilePanel('editorial');
  };

  const startResize = (
    axis: 'vertical' | 'horizontal',
    event: React.PointerEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    const container = axis === 'vertical' ? desktopRef.current : rightColumnRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';

    const move = (pointerEvent: PointerEvent) => {
      if (axis === 'vertical') {
        setLeftSize(clamp(((pointerEvent.clientX - rect.left) / rect.width) * 100, 28, 72));
      } else {
        setSolutionSize(clamp(((pointerEvent.clientY - rect.top) / rect.height) * 100, 30, 78));
      }
    };
    const stop = () => {
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
  };

  const editorialPanel = <EditorialPanel onClose={() => togglePanel('editorial')} showClose />;
  const solutionPanel = (
    <SolutionPanel
      listState={listState}
      solutions={solutions}
      activeSolutionIndex={activeSolutionIndex}
      onSolutionChange={setActiveSolutionIndex}
      solution={solutionEntry}
      solutionState={solutionState}
      contestYear={contestYear}
      problemCode={problemCode}
      commentsVisible={commentsVisible}
      onToggleComments={() => setCommentsVisible((current) => !current)}
      onClose={() => togglePanel('solution')}
      showClose
    />
  );
  const testsPanel = (
    <TestsPanel
      listState={listState}
      tests={tests}
      activeTestIndex={activeTestIndex}
      onTestChange={setActiveTestIndex}
      activeTest={activeTest}
      testData={testData}
      testState={testState}
      onDownload={() => setDownloadOpen(true)}
      onClose={() => togglePanel('tests')}
      showClose
    />
  );

  return (
    <div className="flex min-h-[calc(100dvh-var(--nav-h)-2.75rem)] flex-col bg-background lg:h-[calc(100dvh-var(--nav-h)-2.75rem)] lg:min-h-[680px]">
      <header className="shrink-0 border-b border-border-default bg-background px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <Link
              href="/solutions"
              className="mb-1.5 inline-flex items-center gap-1.5 text-xs text-foreground-lighter transition-colors hover:text-foreground"
            >
              <ArrowLeftIcon width="13" height="13" />
              Back to solutions
            </Link>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {problemInfo?.name || `${contestYear} ${problemCode.toUpperCase()}`}
              </h1>
              {problemInfo?.difficulty && (
                <span
                  className={`inline-flex items-center rounded-xs px-2.5 py-1 text-[11px] font-medium leading-none ${difficultyClass(
                    problemInfo.difficulty
                  )}`}
                >
                  {problemInfo.difficulty}
                </span>
              )}
            </div>
            {problemInfo?.tags?.length ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {problemInfo.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-xs border border-border-default bg-surface-200 px-2 py-0.5 text-[10px] font-medium text-foreground-light"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          {(tests.length > 0 || solutions.length > 0) && (
            <Button
              type="default"
              size="small"
              iconLeft={<DownloadIcon width="14" height="14" />}
              onClick={() => setDownloadOpen(true)}
            >
              Download
            </Button>
          )}
        </div>
      </header>

      <div className="hidden shrink-0 items-center justify-between gap-3 border-b border-border-default bg-surface-100 px-4 py-2 lg:flex lg:px-8">
        <div className="flex items-center gap-1.5">
          <span className="mr-1 text-[11px] text-foreground-lighter">Panels</span>
          {(
            [
              ['editorial', 'Editorial'],
              ['solution', 'Solution'],
              ['tests', 'Test cases'],
            ] as const
          ).map(([panel, label]) => (
            <button
              key={panel}
              type="button"
              onClick={() => togglePanel(panel)}
              aria-pressed={visible[panel]}
              className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                visible[panel]
                  ? 'border-brand-400 bg-brand-200 text-brand-600 dark:text-brand'
                  : 'border-border-default bg-background text-foreground-lighter hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={resetLayout}
          className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-[11px] text-foreground-light hover:bg-surface-200 hover:text-foreground"
        >
          <ResetIcon width="12" height="12" />
          Reset layout
        </button>
      </div>

      <div ref={desktopRef} className="hidden min-h-0 flex-1 p-3 lg:flex">
        {!visible.editorial && !rightVisible ? (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border-strong text-sm text-foreground-lighter">
            Reopen a panel from the toolbar above.
          </div>
        ) : (
          <>
            {visible.editorial && (
              <div
                className="min-w-0 overflow-hidden rounded-lg border border-border-default bg-surface-100"
                style={{ width: rightVisible ? `${leftSize}%` : '100%' }}
              >
                {editorialPanel}
              </div>
            )}

            {visible.editorial && rightVisible && (
              <ResizeHandle
                orientation="vertical"
                value={leftSize}
                onPointerDown={(event) => startResize('vertical', event)}
                onChange={(delta) => setLeftSize((current) => clamp(current + delta, 28, 72))}
              />
            )}

            {rightVisible && (
              <div ref={rightColumnRef} className="flex min-h-0 min-w-0 flex-1 flex-col">
                {visible.solution && (
                  <div
                    className="min-h-0 overflow-hidden rounded-lg border border-border-default bg-surface-100"
                    style={{ height: visible.tests ? `${solutionSize}%` : '100%' }}
                  >
                    {solutionPanel}
                  </div>
                )}

                {visible.solution && visible.tests && (
                  <ResizeHandle
                    orientation="horizontal"
                    value={solutionSize}
                    onPointerDown={(event) => startResize('horizontal', event)}
                    onChange={(delta) =>
                      setSolutionSize((current) => clamp(current + delta, 30, 78))
                    }
                  />
                )}

                {visible.tests && (
                  <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-border-default bg-surface-100">
                    {testsPanel}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex min-h-[70dvh] flex-1 flex-col lg:hidden">
        <div className="flex shrink-0 overflow-x-auto border-b border-border-default bg-surface-100 px-3">
          {(
            [
              ['editorial', 'Editorial'],
              ['solution', 'Solution'],
              ['tests', 'Test cases'],
            ] as const
          ).map(([panel, label]) => (
            <button
              key={panel}
              type="button"
              onClick={() => setMobilePanel(panel)}
              className={`border-b-2 px-4 py-3 text-sm font-medium whitespace-nowrap ${
                mobilePanel === panel
                  ? 'border-brand-500 text-brand'
                  : 'border-transparent text-foreground-light'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="min-h-0 flex-1 bg-surface-100">
          {mobilePanel === 'editorial' && <EditorialPanel showClose={false} />}
          {mobilePanel === 'solution' && (
            <SolutionPanel
              listState={listState}
              solutions={solutions}
              activeSolutionIndex={activeSolutionIndex}
              onSolutionChange={setActiveSolutionIndex}
              solution={solutionEntry}
              solutionState={solutionState}
              contestYear={contestYear}
              problemCode={problemCode}
              commentsVisible={commentsVisible}
              onToggleComments={() => setCommentsVisible((current) => !current)}
              showClose={false}
            />
          )}
          {mobilePanel === 'tests' && (
            <TestsPanel
              listState={listState}
              tests={tests}
              activeTestIndex={activeTestIndex}
              onTestChange={setActiveTestIndex}
              activeTest={activeTest}
              testData={testData}
              testState={testState}
              onDownload={() => setDownloadOpen(true)}
              showClose={false}
            />
          )}
        </div>
      </div>

      <DownloadDialog
        open={downloadOpen}
        onClose={() => setDownloadOpen(false)}
        apiBase={CONTEST_API_BASE}
        year={contestYear}
        code={problemCode}
        tests={tests}
        solutions={solutions}
      />
    </div>
  );
}

function PanelHeader({
  icon,
  title,
  children,
  onClose,
  showClose,
}: {
  icon: React.ReactNode;
  title: string;
  children?: React.ReactNode;
  onClose?: () => void;
  showClose: boolean;
}) {
  return (
    <div className="flex min-h-11 shrink-0 items-center justify-between gap-3 border-b border-border-default bg-surface-200 px-3">
      <div className="flex min-w-0 items-center gap-2 text-xs font-semibold text-foreground">
        <span className="text-brand">{icon}</span>
        <span className="truncate">{title}</span>
      </div>
      <div className="flex min-w-0 items-center gap-1.5">
        {children}
        {showClose && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1.5 text-foreground-lighter hover:bg-surface-300 hover:text-foreground"
            aria-label={`Close ${title} panel`}
            title={`Close ${title}`}
          >
            <Cross2Icon width="13" height="13" />
          </button>
        )}
      </div>
    </div>
  );
}

function EditorialPanel({ onClose, showClose }: { onClose?: () => void; showClose: boolean }) {
  return (
    <section className="flex size-full min-h-0 flex-col" aria-label="Editorial">
      <PanelHeader
        icon={<ReaderIcon width="15" height="15" />}
        title="Editorial"
        onClose={onClose}
        showClose={showClose}
      >
        <Button asChild type="primary" size="tiny">
          <Link href="/create-post">Ask a question</Link>
        </Button>
      </PanelHeader>
      <article className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7">
        <div className="mb-5 rounded-md border border-brand-300 bg-brand-200 px-3 py-2 text-xs text-brand-600 dark:text-brand">
          Preview editorial · placeholder content only
        </div>
        <div className="mx-auto max-w-3xl [&_h1]:mb-3 [&_h1]:mt-8 [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-foreground [&_h1:first-child]:mt-0 [&_blockquote]:rounded-r-md [&_blockquote]:border-l-2 [&_blockquote]:border-brand-400 [&_blockquote]:bg-surface-200 [&_blockquote]:px-3 [&_blockquote]:py-2">
          <MarkdownPreview content={MOCK_EDITORIAL} />
        </div>
      </article>
    </section>
  );
}

function SolutionPanel({
  listState,
  solutions,
  activeSolutionIndex,
  onSolutionChange,
  solution,
  solutionState,
  contestYear,
  problemCode,
  commentsVisible,
  onToggleComments,
  onClose,
  showClose,
}: {
  listState: ListState;
  solutions: ContestSolutionMeta[];
  activeSolutionIndex: number | null;
  onSolutionChange: (index: number) => void;
  solution: SolutionEntry | null;
  solutionState: LoadState;
  contestYear: string;
  problemCode: string;
  commentsVisible: boolean;
  onToggleComments: () => void;
  onClose?: () => void;
  showClose: boolean;
}) {
  return (
    <section className="flex size-full min-h-0 flex-col" aria-label="Solution">
      <PanelHeader
        icon={<CodeIcon width="15" height="15" />}
        title="Solution"
        onClose={onClose}
        showClose={showClose}
      >
        {solutions.length > 0 && activeSolutionIndex !== null && (
          <select
            value={activeSolutionIndex}
            onChange={(event) => onSolutionChange(Number(event.target.value))}
            className="h-7 max-w-36 rounded-md border border-border-strong bg-surface-100 px-2 text-[11px] text-foreground focus:border-brand-highlight focus:outline-none"
            aria-label="Choose solution"
          >
            {solutions.map((entry, index) => (
              <option key={`${entry.n}.${entry.ext}`} value={index}>
                {index + 1} · {languageLabel(languageFromExtension(entry.ext))}
              </option>
            ))}
          </select>
        )}
        <button
          type="button"
          onClick={onToggleComments}
          aria-pressed={commentsVisible}
          className={`inline-flex h-7 items-center gap-1 rounded-md border px-2 text-[11px] transition-colors ${
            commentsVisible
              ? 'border-brand-400 bg-brand-200 text-brand-600 dark:text-brand'
              : 'border-border-strong bg-surface-100 text-foreground-lighter hover:text-foreground'
          }`}
          title="Toggle inline comments"
        >
          <ChatBubbleIcon width="12" height="12" />
          <span className="hidden xl:inline">Comments</span>
        </button>
        {solution && (
          <a
            href={contestDownloadUrl(
              contestYear,
              problemCode,
              `solutions/${solution.n}.${solution.ext}`
            )}
            className="rounded p-1.5 text-foreground-lighter hover:bg-surface-300 hover:text-brand"
            aria-label="Download selected solution"
            title="Download solution"
          >
            <DownloadIcon width="14" height="14" />
          </a>
        )}
      </PanelHeader>

      <div className="min-h-0 flex-1">
        {listState === 'loading' || solutionState === 'loading' ? (
          <PanelStatus label="Loading solution…" loading />
        ) : listState === 'invalid' ? (
          <PanelStatus label="This problem does not exist." />
        ) : listState === 'error' || solutionState === 'error' ? (
          <PanelStatus label="Unable to load solutions right now." error />
        ) : solutions.length === 0 ? (
          <PanelStatus label="No solution is available yet." />
        ) : solution ? (
          <CommentableCode
            key={`${solution.n}.${solution.ext}`}
            code={solution.code}
            language={solution.language}
            commentsVisible={commentsVisible}
          />
        ) : (
          <PanelStatus label="Choose a solution to view its code." />
        )}
      </div>
    </section>
  );
}

function TestsPanel({
  listState,
  tests,
  activeTestIndex,
  onTestChange,
  activeTest,
  testData,
  testState,
  onDownload,
  onClose,
  showClose,
}: {
  listState: ListState;
  tests: ContestTestMeta[];
  activeTestIndex: number | null;
  onTestChange: (index: number) => void;
  activeTest: ContestTestMeta | null;
  testData: TestCaseData;
  testState: LoadState;
  onDownload: () => void;
  onClose?: () => void;
  showClose: boolean;
}) {
  const largeFile =
    activeTest && Math.max(activeTest.inputBytes, activeTest.outputBytes) > LARGE_FILE_BYTES;

  return (
    <section className="flex size-full min-h-0 flex-col" aria-label="Test cases">
      <PanelHeader
        icon={<FileTextIcon width="15" height="15" />}
        title="Test cases"
        onClose={onClose}
        showClose={showClose}
      >
        {tests.length > 0 && (
          <button
            type="button"
            onClick={onDownload}
            className="rounded p-1.5 text-foreground-lighter hover:bg-surface-300 hover:text-brand"
            aria-label="Download test cases"
            title="Download test cases"
          >
            <DownloadIcon width="14" height="14" />
          </button>
        )}
      </PanelHeader>

      {tests.length > 0 && (
        <div className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-border-default bg-surface-100 px-3 py-2">
          {tests.map((test, index) => (
            <button
              key={`${test.sample ? 'sample' : 'case'}-${test.n}`}
              type="button"
              onClick={() => onTestChange(index)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium whitespace-nowrap transition-colors ${
                activeTestIndex === index
                  ? 'bg-brand-500 text-white'
                  : 'bg-surface-200 text-foreground-light hover:bg-surface-300 hover:text-foreground'
              }`}
            >
              {test.sample ? `Sample ${test.n}` : `Case ${test.n}`}
            </button>
          ))}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-auto p-3">
        {listState === 'loading' || testState === 'loading' ? (
          <PanelStatus label="Loading test case…" loading />
        ) : listState === 'invalid' ? (
          <PanelStatus label="This problem does not exist." />
        ) : listState === 'error' ? (
          <PanelStatus label="Unable to load test cases right now." error />
        ) : tests.length === 0 ? (
          <PanelStatus label="No test cases are available." />
        ) : testState === 'error' ? (
          <PanelStatus label="This test case could not be previewed." error />
        ) : testState === 'success' && activeTest ? (
          <div className="space-y-3">
            {largeFile && (
              <div className="flex items-start gap-2 rounded-md border border-warning-400 bg-warning-200 px-3 py-2 text-xs text-warning-600">
                <ExclamationTriangleIcon width="13" height="13" className="mt-0.5 shrink-0" />
                Preview is truncated because this is a large file. Download it for the full data.
              </div>
            )}
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              <TestValue label="Input" bytes={activeTest.inputBytes} value={testData.input} />
              <TestValue
                label="Expected output"
                bytes={activeTest.outputBytes}
                value={testData.output}
              />
            </div>
          </div>
        ) : (
          <PanelStatus label="Select a test case to view its input and output." />
        )}
      </div>
    </section>
  );
}

function TestValue({
  label,
  bytes,
  value,
}: {
  label: string;
  bytes: number;
  value: string | null;
}) {
  return (
    <div className="min-w-0">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <h3 className="text-[11px] font-medium text-foreground-light">{label}</h3>
        <span className="text-[10px] text-foreground-lighter">{formatSize(bytes)}</span>
      </div>
      <pre className="min-h-24 overflow-auto rounded-md border border-border-strong bg-background p-2.5 font-mono text-xs leading-relaxed text-foreground">
        {value ?? 'Unavailable'}
      </pre>
    </div>
  );
}

function PanelStatus({
  label,
  loading = false,
  error = false,
}: {
  label: string;
  loading?: boolean;
  error?: boolean;
}) {
  return (
    <div
      className={`flex size-full min-h-32 items-center justify-center gap-2 p-6 text-center text-sm ${
        error ? 'text-destructive' : 'text-foreground-lighter'
      }`}
    >
      {loading ? (
        <span className="size-5 animate-spin rounded-full border-2 border-surface-300 border-t-brand" />
      ) : error ? (
        <ExclamationTriangleIcon width="16" height="16" />
      ) : (
        <InfoCircledIcon width="16" height="16" />
      )}
      <span>{label}</span>
    </div>
  );
}

function ResizeHandle({
  orientation,
  value,
  onPointerDown,
  onChange,
}: {
  orientation: 'vertical' | 'horizontal';
  value: number;
  onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onChange: (delta: number) => void;
}) {
  const vertical = orientation === 'vertical';

  return (
    <button
      type="button"
      role="separator"
      aria-label={`Resize ${vertical ? 'editorial and solution' : 'solution and test case'} panels`}
      aria-orientation={orientation}
      aria-valuemin={vertical ? 28 : 30}
      aria-valuemax={vertical ? 72 : 78}
      aria-valuenow={Math.round(value)}
      onPointerDown={onPointerDown}
      onKeyDown={(event) => {
        if (vertical && event.key === 'ArrowLeft') onChange(-2);
        if (vertical && event.key === 'ArrowRight') onChange(2);
        if (!vertical && event.key === 'ArrowUp') onChange(-2);
        if (!vertical && event.key === 'ArrowDown') onChange(2);
      }}
      className={`group relative shrink-0 touch-none focus:outline-none ${
        vertical ? 'w-3 cursor-col-resize' : 'h-3 cursor-row-resize'
      }`}
    >
      <span
        className={`absolute bg-border-strong transition-colors group-hover:bg-brand-400 group-focus:bg-brand-400 ${
          vertical
            ? 'inset-y-2 left-1/2 w-px -translate-x-1/2'
            : 'inset-x-2 top-1/2 h-px -translate-y-1/2'
        }`}
      />
    </button>
  );
}
