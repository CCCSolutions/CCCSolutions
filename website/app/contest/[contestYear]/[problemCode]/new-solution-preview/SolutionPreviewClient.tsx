'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeftIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  CodeIcon,
  DownloadIcon,
  EnterFullScreenIcon,
  ExclamationTriangleIcon,
  ExitFullScreenIcon,
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
type MinimizedState = Record<PanelName, boolean>;

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
const DEFAULT_COMMENT_SIZE = 272;
const LAYOUT_STORAGE_KEY = 'cccsolutions-solution-layout-v1';
const DEFAULT_MINIMIZED: MinimizedState = {
  editorial: false,
  solution: false,
  tests: false,
};

const EDITORIAL_CONTENT = [
  '# Intuition',
  '',
  'The key observation is that the final ticket count depends only on the two groups that already have tickets reserved. Subtract both values from the total capacity.',
  '',
  'If the remaining count is non-negative, everyone fits and that count is the number of unused tickets. Otherwise, the concert does not have enough tickets.',
  '',
  '$$\\text{remaining} = T - P - B$$',
  '',
  '# Approach',
  '',
  '1. Read the number of Bayview students, the ticket capacity, and the number of Portview students.',
  '2. Compute `remaining = T - P - B`.',
  '3. Print `Y` and the remaining count when the value is non-negative; otherwise print `N`.',
  '',
  '# Complexity',
  '',
  '- Time complexity: $O(1)$',
  '- Space complexity: $O(1)$',
  '',
  '# Implementation notes',
  '',
  'The comparison includes zero because filling every available seat is still a valid result.',
  '',
  '```python',
  'remaining = T - P - B',
  'if remaining >= 0:',
  '    print("Y", remaining)',
  'else:',
  '    print("N")',
  '```',
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

function LayoutControls({
  view,
  onViewChange,
  onReset,
  showReset = true,
}: {
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onReset: () => void;
  showReset?: boolean;
}) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <div
        className="inline-flex rounded-md border border-border-default bg-background p-0.5"
        aria-label="Solution page layout"
      >
        {(['classic', 'new'] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onViewChange(option)}
            aria-pressed={view === option}
            className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
              view === option
                ? 'bg-brand-500 text-white'
                : 'text-foreground-light hover:bg-surface-200 hover:text-foreground'
            }`}
          >
            {option === 'classic' ? 'Classic' : 'New'}
          </button>
        ))}
      </div>
      {showReset && (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[11px] text-foreground-light transition-colors hover:bg-surface-200 hover:text-foreground"
        >
          <ResetIcon width="12" height="12" />
          Reset layout
        </button>
      )}
    </div>
  );
}

export default function SolutionPreviewClient() {
  const [view, setView] = useState<ViewMode>('new');

  const clearSavedLayout = () => {
    window.localStorage.removeItem(LAYOUT_STORAGE_KEY);
  };

  return view === 'classic' ? (
    <ProblemPageClient
      headerControls={
        <LayoutControls
          view={view}
          onViewChange={setView}
          onReset={clearSavedLayout}
          showReset={false}
        />
      }
    />
  ) : (
    <WorkspaceView view={view} onViewChange={setView} />
  );
}

function WorkspaceView({
  view,
  onViewChange,
}: {
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
}) {
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
  const [minimized, setMinimized] = useState<MinimizedState>(DEFAULT_MINIMIZED);
  const [fullscreen, setFullscreen] = useState<PanelName | null>(null);
  const [leftSize, setLeftSize] = useState(DEFAULT_LEFT_SIZE);
  const [solutionSize, setSolutionSize] = useState(DEFAULT_SOLUTION_SIZE);
  const [commentSize, setCommentSize] = useState(DEFAULT_COMMENT_SIZE);
  const [mobilePanel, setMobilePanel] = useState<PanelName>('editorial');
  const [layoutLoaded, setLayoutLoaded] = useState(false);
  const desktopRef = useRef<HTMLDivElement>(null);
  const rightColumnRef = useRef<HTMLDivElement>(null);

  const activeSolution =
    activeSolutionIndex === null ? null : (solutions[activeSolutionIndex] ?? null);
  const activeTest = activeTestIndex === null ? null : (tests[activeTestIndex] ?? null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (saved) {
        const layout = JSON.parse(saved) as {
          leftSize?: number;
          solutionSize?: number;
          commentSize?: number;
          minimized?: Partial<MinimizedState>;
        };
        if (typeof layout.leftSize === 'number') {
          setLeftSize(clamp(layout.leftSize, 28, 72));
        }
        if (typeof layout.solutionSize === 'number') {
          setSolutionSize(clamp(layout.solutionSize, 30, 78));
        }
        if (typeof layout.commentSize === 'number') {
          setCommentSize(clamp(layout.commentSize, 176, 440));
        }
        if (layout.minimized) {
          const restored = { ...DEFAULT_MINIMIZED, ...layout.minimized };
          if (restored.solution && restored.tests) restored.tests = false;
          setMinimized(restored);
        }
      }
    } catch {
      window.localStorage.removeItem(LAYOUT_STORAGE_KEY);
    } finally {
      setLayoutLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!layoutLoaded) return;
    window.localStorage.setItem(
      LAYOUT_STORAGE_KEY,
      JSON.stringify({ leftSize, solutionSize, commentSize, minimized })
    );
  }, [commentSize, layoutLoaded, leftSize, minimized, solutionSize]);

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

  const toggleMinimized = (panel: PanelName) => {
    setFullscreen(null);
    setMinimized((current) => {
      const next = { ...current, [panel]: !current[panel] };

      if (next.solution && next.tests) {
        const otherPanel = panel === 'solution' ? 'tests' : 'solution';
        next[otherPanel] = false;
      }

      return next;
    });
  };

  const toggleFullscreen = (panel: PanelName) => {
    setMinimized((current) => ({ ...current, [panel]: false }));
    setFullscreen((current) => (current === panel ? null : panel));
  };

  const resetLayout = () => {
    setMinimized(DEFAULT_MINIMIZED);
    setFullscreen(null);
    setLeftSize(DEFAULT_LEFT_SIZE);
    setSolutionSize(DEFAULT_SOLUTION_SIZE);
    setCommentSize(DEFAULT_COMMENT_SIZE);
    setMobilePanel('editorial');
    window.localStorage.removeItem(LAYOUT_STORAGE_KEY);
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

  const editorialPanel = (
    <EditorialPanel
      problemInfo={problemInfo}
      contestYear={contestYear}
      problemCode={problemCode}
      layoutControls={
        <LayoutControls view={view} onViewChange={onViewChange} onReset={resetLayout} />
      }
      minimized={minimized.editorial}
      fullscreen={fullscreen === 'editorial'}
      onMinimize={() => toggleMinimized('editorial')}
      onFullscreen={() => toggleFullscreen('editorial')}
      showPanelControls
    />
  );
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
      commentSize={commentSize}
      onCommentSizeChange={setCommentSize}
      minimized={minimized.solution}
      fullscreen={fullscreen === 'solution'}
      onMinimize={() => toggleMinimized('solution')}
      onFullscreen={() => toggleFullscreen('solution')}
      showPanelControls
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
      minimized={minimized.tests}
      fullscreen={fullscreen === 'tests'}
      onMinimize={() => toggleMinimized('tests')}
      onFullscreen={() => toggleFullscreen('tests')}
      showPanelControls
    />
  );

  return (
    <div className="mb-3 flex min-h-[70dvh] flex-col bg-background text-foreground lg:h-[calc(100dvh-var(--nav-h)-0.75rem)] lg:min-h-0">
      <div ref={desktopRef} className="hidden min-h-0 flex-1 p-3 lg:flex">
        {fullscreen ? (
          <div className="min-h-0 min-w-0 flex-1 overflow-hidden rounded-lg border border-border-default bg-surface-100">
            {fullscreen === 'editorial'
              ? editorialPanel
              : fullscreen === 'solution'
                ? solutionPanel
                : testsPanel}
          </div>
        ) : (
          <>
            <div
              className={`min-w-0 overflow-hidden rounded-lg border border-border-default bg-surface-100 ${
                minimized.editorial ? 'shrink-0' : ''
              }`}
              style={{ width: minimized.editorial ? '44px' : `${leftSize}%` }}
            >
              {editorialPanel}
            </div>

            {!minimized.editorial && (
              <ResizeHandle
                orientation="vertical"
                value={leftSize}
                onPointerDown={(event) => startResize('vertical', event)}
                onChange={(delta) => setLeftSize((current) => clamp(current + delta, 28, 72))}
              />
            )}
            {minimized.editorial && <div className="w-3 shrink-0" />}

            <div ref={rightColumnRef} className="flex min-h-0 min-w-0 flex-1 flex-col">
              <div
                className={`overflow-hidden rounded-lg border border-border-default bg-surface-100 ${
                  minimized.solution
                    ? 'h-11 shrink-0'
                    : minimized.tests
                      ? 'min-h-0 flex-1'
                      : 'min-h-0'
                }`}
                style={
                  !minimized.solution && !minimized.tests
                    ? { height: `${solutionSize}%` }
                    : undefined
                }
              >
                {solutionPanel}
              </div>

              {!minimized.solution && !minimized.tests ? (
                <ResizeHandle
                  orientation="horizontal"
                  value={solutionSize}
                  onPointerDown={(event) => startResize('horizontal', event)}
                  onChange={(delta) => setSolutionSize((current) => clamp(current + delta, 30, 78))}
                />
              ) : (
                <div className="h-3 shrink-0" />
              )}

              <div
                className={`overflow-hidden rounded-lg border border-border-default bg-surface-100 ${
                  minimized.tests ? 'h-11 shrink-0' : 'min-h-0 flex-1'
                }`}
              >
                {testsPanel}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex min-h-[70dvh] flex-1 flex-col lg:hidden">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border-default bg-surface-100 px-3 py-2">
          <span className="min-w-0 truncate text-xs font-semibold text-foreground">
            {problemInfo?.name || `${contestYear} ${problemCode.toUpperCase()}`}
          </span>
          <LayoutControls view={view} onViewChange={onViewChange} onReset={resetLayout} />
        </div>
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
          {mobilePanel === 'editorial' && (
            <EditorialPanel
              problemInfo={problemInfo}
              contestYear={contestYear}
              problemCode={problemCode}
              minimized={false}
              fullscreen={false}
              onMinimize={() => undefined}
              onFullscreen={() => undefined}
              showPanelControls={false}
            />
          )}
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
              commentSize={commentSize}
              onCommentSizeChange={setCommentSize}
              minimized={false}
              fullscreen={false}
              onMinimize={() => undefined}
              onFullscreen={() => undefined}
              showPanelControls={false}
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
              minimized={false}
              fullscreen={false}
              onMinimize={() => undefined}
              onFullscreen={() => undefined}
              showPanelControls={false}
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
  minimized,
  fullscreen,
  onMinimize,
  onFullscreen,
  showPanelControls,
  minimizeIcon,
}: {
  icon: React.ReactNode;
  title: string;
  children?: React.ReactNode;
  minimized: boolean;
  fullscreen: boolean;
  onMinimize: () => void;
  onFullscreen: () => void;
  showPanelControls: boolean;
  minimizeIcon?: React.ReactNode;
}) {
  return (
    <div className="group relative flex h-11 shrink-0 items-center justify-between gap-3 border-b border-border-default bg-surface-200 px-3">
      <div className="flex min-w-0 items-center gap-2 text-xs font-semibold text-foreground">
        <span className="shrink-0 text-brand">{icon}</span>
        <span className="truncate">{title}</span>
      </div>
      {!minimized && (
        <div className="flex min-w-0 items-center gap-1.5">
          {children}
          {showPanelControls && (
            <div className="flex items-center">
              <button
                type="button"
                onClick={onFullscreen}
                className="rounded p-1.5 text-foreground-lighter hover:bg-surface-300 hover:text-foreground"
                aria-label={`${fullscreen ? 'Exit fullscreen for' : 'Fullscreen'} ${title} panel`}
                title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {fullscreen ? (
                  <ExitFullScreenIcon width="13" height="13" />
                ) : (
                  <EnterFullScreenIcon width="13" height="13" />
                )}
              </button>
              <button
                type="button"
                onClick={onMinimize}
                className="rounded p-1.5 text-foreground-lighter hover:bg-surface-300 hover:text-foreground"
                aria-label={`Minimize ${title} panel`}
                title="Minimize"
              >
                {minimizeIcon ?? <ChevronDownIcon width="13" height="13" />}
              </button>
            </div>
          )}
        </div>
      )}
      {minimized && showPanelControls && (
        <div className="flex items-center">
          <button
            type="button"
            onClick={onFullscreen}
            className="rounded p-1.5 text-foreground-lighter hover:bg-surface-300 hover:text-foreground"
            aria-label={`Fullscreen ${title} panel`}
            title="Fullscreen"
          >
            <EnterFullScreenIcon width="13" height="13" />
          </button>
          <button
            type="button"
            onClick={onMinimize}
            className="rounded p-1.5 text-foreground-lighter hover:bg-surface-300 hover:text-foreground"
            aria-label={`Restore ${title} panel`}
            title="Restore"
          >
            <ChevronUpIcon width="13" height="13" />
          </button>
        </div>
      )}
    </div>
  );
}

function EditorialPanel({
  problemInfo,
  contestYear,
  problemCode,
  layoutControls,
  minimized,
  fullscreen,
  onMinimize,
  onFullscreen,
  showPanelControls,
}: {
  problemInfo: (typeof problems)[number] | undefined;
  contestYear: string;
  problemCode: string;
  layoutControls?: React.ReactNode;
  minimized: boolean;
  fullscreen: boolean;
  onMinimize: () => void;
  onFullscreen: () => void;
  showPanelControls: boolean;
}) {
  const title = problemInfo?.name || `${contestYear} ${problemCode.toUpperCase()}`;

  if (minimized && showPanelControls) {
    return (
      <section
        className="flex size-full min-h-0 flex-col items-center bg-surface-200 py-2"
        aria-label="Editorial"
      >
        <button
          type="button"
          onClick={onMinimize}
          className="flex min-h-0 flex-1 flex-col items-center gap-2 text-foreground-light transition-colors hover:text-foreground"
          aria-label="Restore editorial panel"
          title="Restore editorial"
        >
          <ReaderIcon width="16" height="16" className="shrink-0 text-brand" />
          <span className="[writing-mode:vertical-rl] rotate-180 text-xs font-semibold tracking-wide">
            Editorial
          </span>
        </button>
        <div className="mt-auto flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={onFullscreen}
            className="rounded p-2 text-foreground-lighter transition-colors hover:bg-surface-300 hover:text-foreground"
            aria-label="Fullscreen editorial panel"
            title="Fullscreen"
          >
            <EnterFullScreenIcon width="14" height="14" />
          </button>
          <button
            type="button"
            onClick={onMinimize}
            className="rounded p-2 text-foreground-lighter transition-colors hover:bg-surface-300 hover:text-foreground"
            aria-label="Restore editorial panel"
            title="Restore"
          >
            <ChevronRightIcon width="15" height="15" />
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="flex size-full min-h-0 flex-col" aria-label="Editorial">
      <PanelHeader
        icon={<ReaderIcon width="15" height="15" />}
        title={title}
        minimized={minimized}
        fullscreen={fullscreen}
        onMinimize={onMinimize}
        onFullscreen={onFullscreen}
        showPanelControls={showPanelControls}
        minimizeIcon={<ChevronLeftIcon width="13" height="13" />}
      >
        {layoutControls}
      </PanelHeader>
      {!minimized && (
        <article className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7">
          <div className="mx-auto mb-6 max-w-3xl border-b border-border-default pb-5">
            <Link
              href="/solutions"
              className="mb-3 inline-flex items-center gap-1.5 text-xs text-foreground-lighter transition-colors hover:text-foreground"
            >
              <ArrowLeftIcon width="13" height="13" />
              Back to solutions
            </Link>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  {title}
                </h1>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {problemInfo?.difficulty && (
                    <span
                      className={`inline-flex items-center rounded-xs px-2.5 py-1 text-[11px] font-medium leading-none ${difficultyClass(
                        problemInfo.difficulty
                      )}`}
                    >
                      {problemInfo.difficulty}
                    </span>
                  )}
                  {problemInfo?.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-xs border border-border-default bg-surface-200 px-2 py-0.5 text-[10px] font-medium text-foreground-light"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <Button asChild type="primary" size="tiny">
                <Link href="/create-post">Ask a question</Link>
              </Button>
            </div>
          </div>
          <div className="mx-auto max-w-3xl [&_h1]:mb-3 [&_h1]:mt-8 [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-foreground [&_h1:first-child]:mt-0 [&_blockquote]:rounded-r-md [&_blockquote]:border-l-2 [&_blockquote]:border-brand-400 [&_blockquote]:bg-surface-200 [&_blockquote]:px-3 [&_blockquote]:py-2">
            <MarkdownPreview content={EDITORIAL_CONTENT} />
          </div>
        </article>
      )}
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
  commentSize,
  onCommentSizeChange,
  minimized,
  fullscreen,
  onMinimize,
  onFullscreen,
  showPanelControls,
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
  commentSize: number;
  onCommentSizeChange: (size: number) => void;
  minimized: boolean;
  fullscreen: boolean;
  onMinimize: () => void;
  onFullscreen: () => void;
  showPanelControls: boolean;
}) {
  return (
    <section className="flex size-full min-h-0 flex-col" aria-label="Solution">
      <PanelHeader
        icon={<CodeIcon width="15" height="15" />}
        title="Solution"
        minimized={minimized}
        fullscreen={fullscreen}
        onMinimize={onMinimize}
        onFullscreen={onFullscreen}
        showPanelControls={showPanelControls}
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
        <Button
          type={commentsVisible ? 'primary' : 'default'}
          size="tiny"
          onClick={onToggleComments}
          aria-pressed={commentsVisible}
          title="Toggle inline comments"
        >
          Comments
        </Button>
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

      {!minimized && (
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
              onCloseComments={onToggleComments}
              railWidth={commentSize}
              onRailWidthChange={onCommentSizeChange}
            />
          ) : (
            <PanelStatus label="Choose a solution to view its code." />
          )}
        </div>
      )}
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
  minimized,
  fullscreen,
  onMinimize,
  onFullscreen,
  showPanelControls,
}: {
  listState: ListState;
  tests: ContestTestMeta[];
  activeTestIndex: number | null;
  onTestChange: (index: number) => void;
  activeTest: ContestTestMeta | null;
  testData: TestCaseData;
  testState: LoadState;
  onDownload: () => void;
  minimized: boolean;
  fullscreen: boolean;
  onMinimize: () => void;
  onFullscreen: () => void;
  showPanelControls: boolean;
}) {
  const largeFile =
    activeTest && Math.max(activeTest.inputBytes, activeTest.outputBytes) > LARGE_FILE_BYTES;

  return (
    <section className="flex size-full min-h-0 flex-col" aria-label="Test cases">
      <PanelHeader
        icon={<FileTextIcon width="15" height="15" />}
        title="Test cases"
        minimized={minimized}
        fullscreen={fullscreen}
        onMinimize={onMinimize}
        onFullscreen={onFullscreen}
        showPanelControls={showPanelControls}
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

      {!minimized && tests.length > 0 && (
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

      {!minimized && (
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
            <PanelStatus label="This test case could not be loaded." error />
          ) : testState === 'success' && activeTest ? (
            <div className="space-y-3">
              {largeFile && (
                <div className="flex items-start gap-2 rounded-md border border-warning-400 bg-warning-200 px-3 py-2 text-xs text-warning-600">
                  <ExclamationTriangleIcon width="13" height="13" className="mt-0.5 shrink-0" />
                  This file is too large to display in full. Download it for the complete data.
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
      )}
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
