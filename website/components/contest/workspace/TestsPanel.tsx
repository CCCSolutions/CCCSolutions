'use client';

import React from 'react';
import { DownloadIcon, ExclamationTriangleIcon, FileTextIcon } from '@radix-ui/react-icons';
import { Tooltip } from '../../ui/tooltip';
import type { ContestTestMeta } from '../../../lib/contest-api';
import {
  formatSize,
  LARGE_FILE_BYTES,
  type ListStatus,
  type LoadState,
  type TestCaseData,
} from '../useContestData';
import { PanelHeader, PanelStatus, type PanelControlProps } from './PanelChrome';

export function TestsPanel({
  listStatus,
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
}: PanelControlProps & {
  listStatus: ListStatus;
  tests: ContestTestMeta[];
  activeTestIndex: number | null;
  onTestChange: (index: number) => void;
  activeTest: ContestTestMeta | null;
  testData: TestCaseData;
  testState: LoadState;
  onDownload: () => void;
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
          <Tooltip content="Download test cases">
            <button
              type="button"
              onClick={onDownload}
              className="rounded p-1.5 text-foreground-lighter hover:bg-surface-300 hover:text-brand"
              aria-label="Download test cases"
            >
              <DownloadIcon width="14" height="14" />
            </button>
          </Tooltip>
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
          {listStatus === 'loading' || testState === 'loading' ? (
            <PanelStatus label="Loading test case…" loading />
          ) : listStatus === 'invalid' ? (
            <PanelStatus label="This problem does not exist." />
          ) : listStatus === 'error' ? (
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
