'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CodeIcon, DownloadIcon, PlusIcon } from '@radix-ui/react-icons';
import { Button } from '../../ui/button';
import { Tooltip } from '../../ui/tooltip';
import { contestDownloadUrl } from '../../../lib/contest-api';
import type { ListStatus, SolutionEntry } from '../useContestData';
import { CommentableCode } from './CommentableCode';
import { PanelHeader, PanelStatus, type PanelControlProps } from './PanelChrome';
import { SolutionSelect } from './SolutionSelect';

// Inline comments are built but not launched. This constant gates every entry point:
// the Comments toggle, the Add comment button and the comment rail inside CommentableCode.
export const INLINE_COMMENTS_ENABLED = false;

const SyntaxHighlighter = dynamic(
  () => import('react-syntax-highlighter').then((mod) => mod.Prism),
  {
    ssr: false,
    loading: () => <div className="p-4 text-sm text-foreground-lighter">Loading code…</div>,
  }
);

function PlainCode({ code, language }: { code: string; language: string }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const codeStyle = mounted && resolvedTheme === 'dark' ? oneDark : oneLight;

  return (
    <div className="size-full overflow-auto">
      <SyntaxHighlighter
        language={language}
        style={codeStyle}
        showLineNumbers
        customStyle={{
          minHeight: '100%',
          margin: 0,
          borderRadius: 0,
          background: 'transparent',
          fontSize: '13px',
          lineHeight: '20px',
          padding: '16px',
        }}
        codeTagProps={{ style: { background: 'transparent' } }}
        lineNumberStyle={{ minWidth: '2.75em', paddingRight: '1em', opacity: 0.45 }}
      >
        {code || '// No solution code available'}
      </SyntaxHighlighter>
    </div>
  );
}

export function SolutionPanel({
  listStatus,
  loading,
  solutionsError,
  solutions,
  activeSolutionIndex,
  onSolutionChange,
  contestYear,
  problemCode,
  commentsVisible,
  onToggleComments,
  onStartComment,
  composerRequest,
  commentSize,
  onCommentSizeChange,
  minimized,
  fullscreen,
  onMinimize,
  onFullscreen,
  showPanelControls,
}: PanelControlProps & {
  listStatus: ListStatus;
  loading: boolean;
  solutionsError: boolean;
  solutions: SolutionEntry[];
  activeSolutionIndex: number;
  onSolutionChange: (index: number) => void;
  contestYear: string;
  problemCode: string;
  commentsVisible: boolean;
  onToggleComments: () => void;
  onStartComment: () => void;
  composerRequest: number;
  commentSize: number;
  onCommentSizeChange: (size: number) => void;
}) {
  const solution = solutions[activeSolutionIndex] ?? null;

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
        {solutions.length > 0 && (
          <SolutionSelect
            solutions={solutions}
            value={activeSolutionIndex}
            onChange={onSolutionChange}
          />
        )}
        <Tooltip content={INLINE_COMMENTS_ENABLED ? 'Toggle inline comments' : 'Coming soon'}>
          <Button
            type={INLINE_COMMENTS_ENABLED && commentsVisible ? 'primary' : 'default'}
            size="tiny"
            onClick={INLINE_COMMENTS_ENABLED ? onToggleComments : undefined}
            aria-pressed={INLINE_COMMENTS_ENABLED ? commentsVisible : undefined}
            aria-disabled={!INLINE_COMMENTS_ENABLED}
            className={INLINE_COMMENTS_ENABLED ? undefined : 'cursor-not-allowed opacity-50'}
          >
            Comments
          </Button>
        </Tooltip>
        <Tooltip content={INLINE_COMMENTS_ENABLED ? 'Add comment' : 'Coming soon'}>
          <button
            type="button"
            onClick={INLINE_COMMENTS_ENABLED ? onStartComment : undefined}
            disabled={INLINE_COMMENTS_ENABLED && !solution}
            aria-disabled={!INLINE_COMMENTS_ENABLED}
            className={`rounded border border-border-strong bg-surface-100 p-1.5 text-foreground-lighter transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              INLINE_COMMENTS_ENABLED
                ? 'hover:bg-surface-300 hover:text-foreground'
                : 'cursor-not-allowed opacity-40'
            }`}
            aria-label="Add comment"
          >
            <PlusIcon width="13" height="13" />
          </button>
        </Tooltip>
        {solution && (
          <Tooltip content="Download solution">
            <a
              href={contestDownloadUrl(
                contestYear,
                problemCode,
                `solutions/${solution.n}.${solution.ext}`
              )}
              className="rounded p-1.5 text-foreground-lighter hover:bg-surface-300 hover:text-brand"
              aria-label="Download selected solution"
            >
              <DownloadIcon width="14" height="14" />
            </a>
          </Tooltip>
        )}
      </PanelHeader>

      {!minimized && (
        <div className="min-h-0 flex-1">
          {loading ? (
            <PanelStatus label="Loading solution…" loading />
          ) : listStatus === 'invalid' ? (
            <PanelStatus label="This problem does not exist." />
          ) : listStatus === 'error' || solutionsError ? (
            <PanelStatus label="Unable to load solutions right now." error />
          ) : !solution ? (
            <PanelStatus label="No solution is available yet." />
          ) : INLINE_COMMENTS_ENABLED ? (
            <CommentableCode
              key={`${solution.n}.${solution.ext}`}
              code={solution.code}
              language={solution.language}
              commentsVisible={commentsVisible}
              composerRequest={composerRequest}
              onCloseComments={onToggleComments}
              railWidth={commentSize}
              onRailWidthChange={onCommentSizeChange}
            />
          ) : (
            <PlainCode
              key={`${solution.n}.${solution.ext}`}
              code={solution.code}
              language={solution.language}
            />
          )}
        </div>
      )}
    </section>
  );
}
