'use client';

import React, { useEffect, useState } from 'react';
import { DownloadDialog } from '../DownloadDialog';
import type { Problem } from '../../../constants';
import { CONTEST_API_BASE } from '../../../lib/contest-api';
import { useTestCase, type useContestData } from '../useContestData';
import { EditorialPanel } from './EditorialPanel';
import { LayoutControls, type ViewMode } from './LayoutControls';
import { ResizeHandle } from './PanelChrome';
import { INLINE_COMMENTS_ENABLED, SolutionPanel } from './SolutionPanel';
import { TestsPanel } from './TestsPanel';
import {
  clamp,
  LEFT_SIZE_RANGE,
  SOLUTION_SIZE_RANGE,
  usePanelLayout,
  type PanelName,
} from './usePanelLayout';

export function WorkspaceView({
  view,
  onViewChange,
  contestYear,
  problemCode,
  problemInfo,
  data,
}: {
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  contestYear: string;
  problemCode: string;
  problemInfo: Problem | undefined;
  data: ReturnType<typeof useContestData>;
}) {
  const { listStatus, loading, tests, solutionsMeta, solutions, solutionsError } = data;
  const layout = usePanelLayout();
  const { minimized, fullscreen, leftSize, solutionSize } = layout;

  const [activeSolutionIndex, setActiveSolutionIndex] = useState(0);
  const [activeTestIndex, setActiveTestIndex] = useState<number | null>(null);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [commentsVisible, setCommentsVisible] = useState(INLINE_COMMENTS_ENABLED);
  const [commentComposerRequest, setCommentComposerRequest] = useState(0);
  const [mobilePanel, setMobilePanel] = useState<PanelName>('editorial');

  useEffect(() => setActiveSolutionIndex(0), [solutions]);
  useEffect(() => setActiveTestIndex(tests.length ? 0 : null), [tests]);

  const activeTest = activeTestIndex === null ? null : (tests[activeTestIndex] ?? null);
  const testCase = useTestCase(contestYear, problemCode, activeTest);

  const resetLayout = () => {
    layout.resetLayout();
    setMobilePanel('editorial');
  };

  const startComment = () => {
    if (!INLINE_COMMENTS_ENABLED) return;
    setCommentsVisible(true);
    setCommentComposerRequest((current) => current + 1);
  };

  const layoutControls = (
    <LayoutControls view={view} onViewChange={onViewChange} onReset={resetLayout} />
  );

  const renderEditorial = (desktop: boolean) => (
    <EditorialPanel
      problemInfo={problemInfo}
      contestYear={contestYear}
      problemCode={problemCode}
      layoutControls={desktop ? layoutControls : undefined}
      minimized={desktop && fullscreen !== 'editorial' && minimized.editorial}
      fullscreen={desktop && fullscreen === 'editorial'}
      onMinimize={() => layout.toggleMinimized('editorial')}
      onFullscreen={() => layout.toggleFullscreen('editorial')}
      showPanelControls={desktop}
    />
  );
  const renderSolution = (desktop: boolean) => (
    <SolutionPanel
      listStatus={listStatus}
      loading={loading}
      solutionsError={solutionsError}
      solutions={solutions}
      activeSolutionIndex={activeSolutionIndex}
      onSolutionChange={setActiveSolutionIndex}
      contestYear={contestYear}
      problemCode={problemCode}
      commentsVisible={commentsVisible}
      onToggleComments={() => setCommentsVisible((current) => !current)}
      onStartComment={startComment}
      composerRequest={commentComposerRequest}
      commentSize={layout.commentSize}
      onCommentSizeChange={layout.setCommentSize}
      minimized={desktop && fullscreen !== 'solution' && minimized.solution}
      fullscreen={desktop && fullscreen === 'solution'}
      onMinimize={() => layout.toggleMinimized('solution')}
      onFullscreen={() => layout.toggleFullscreen('solution')}
      showPanelControls={desktop}
    />
  );
  const renderTests = (desktop: boolean) => (
    <TestsPanel
      listStatus={listStatus}
      tests={tests}
      activeTestIndex={activeTestIndex}
      onTestChange={setActiveTestIndex}
      activeTest={activeTest}
      testData={testCase.data}
      testState={testCase.state}
      onDownload={() => setDownloadOpen(true)}
      minimized={desktop && fullscreen !== 'tests' && minimized.tests}
      fullscreen={desktop && fullscreen === 'tests'}
      onMinimize={() => layout.toggleMinimized('tests')}
      onFullscreen={() => layout.toggleFullscreen('tests')}
      showPanelControls={desktop}
    />
  );

  return (
    <div className="mb-3 flex min-h-[70dvh] flex-col bg-background text-foreground lg:mb-0 lg:h-[calc(100dvh-var(--nav-h))] lg:min-h-0">
      <div ref={layout.desktopRef} className="hidden min-h-0 flex-1 p-3 lg:flex">
        {fullscreen ? (
          <div className="min-h-0 min-w-0 flex-1 overflow-hidden rounded-lg border border-border-default bg-surface-100">
            {fullscreen === 'editorial'
              ? renderEditorial(true)
              : fullscreen === 'solution'
                ? renderSolution(true)
                : renderTests(true)}
          </div>
        ) : (
          <>
            <div
              className={`min-w-0 overflow-hidden rounded-lg border border-border-default bg-surface-100 ${
                minimized.editorial ? 'shrink-0' : ''
              }`}
              style={{ width: minimized.editorial ? '44px' : `${leftSize}%` }}
            >
              {renderEditorial(true)}
            </div>

            {!minimized.editorial && (
              <ResizeHandle
                orientation="vertical"
                value={leftSize}
                onPointerDown={(event) => layout.startResize('vertical', event)}
                onChange={(delta) =>
                  layout.setLeftSize((current) => clamp(current + delta, ...LEFT_SIZE_RANGE))
                }
              />
            )}
            {minimized.editorial && <div className="w-3 shrink-0" />}

            <div ref={layout.rightColumnRef} className="flex min-h-0 min-w-0 flex-1 flex-col">
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
                {renderSolution(true)}
              </div>

              {!minimized.solution && !minimized.tests ? (
                <ResizeHandle
                  orientation="horizontal"
                  value={solutionSize}
                  onPointerDown={(event) => layout.startResize('horizontal', event)}
                  onChange={(delta) =>
                    layout.setSolutionSize((current) =>
                      clamp(current + delta, ...SOLUTION_SIZE_RANGE)
                    )
                  }
                />
              ) : (
                <div className="h-3 shrink-0" />
              )}

              <div
                className={`overflow-hidden rounded-lg border border-border-default bg-surface-100 ${
                  minimized.tests ? 'h-11 shrink-0' : 'min-h-0 flex-1'
                }`}
              >
                {renderTests(true)}
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
          {layoutControls}
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
          {mobilePanel === 'editorial' && renderEditorial(false)}
          {mobilePanel === 'solution' && renderSolution(false)}
          {mobilePanel === 'tests' && renderTests(false)}
        </div>
      </div>

      <DownloadDialog
        open={downloadOpen}
        onClose={() => setDownloadOpen(false)}
        apiBase={CONTEST_API_BASE}
        year={contestYear}
        code={problemCode}
        tests={tests}
        solutions={solutionsMeta}
      />
    </div>
  );
}
