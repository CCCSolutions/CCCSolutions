'use client';

import React, { useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { ChatBubbleIcon, Cross2Icon, PlusIcon } from '@radix-ui/react-icons';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from '../../../../../components/ui/button';

const SyntaxHighlighter = dynamic(
  () => import('react-syntax-highlighter').then((mod) => mod.Prism),
  {
    ssr: false,
    loading: () => <div className="p-4 text-sm text-foreground-lighter">Loading code…</div>,
  }
);

type LineRange = {
  start: number;
  end: number;
  quote: string;
};

type MockComment = LineRange & {
  id: number;
  author: string;
  body: string;
  when: string;
};

const INITIAL_COMMENTS: MockComment[] = [
  {
    id: 1,
    start: 4,
    end: 5,
    quote: 'This branch decides whether the remaining tickets are enough.',
    author: 'mnop',
    body: 'Could we mention why this comparison is sufficient? It took me a second to connect it to the problem statement.',
    when: '8 min ago',
  },
];

function lineFromNode(node: Node | null): number | null {
  const element = node instanceof Element ? node : node?.parentElement;
  const line = element?.closest('[data-code-line]')?.getAttribute('data-code-line');
  if (!line) return null;
  const parsed = Number(line);
  return Number.isFinite(parsed) ? parsed : null;
}

export function CommentableCode({
  code,
  language,
  commentsVisible,
}: {
  code: string;
  language: string;
  commentsVisible: boolean;
}) {
  const { resolvedTheme } = useTheme();
  const codeAreaRef = useRef<HTMLDivElement>(null);
  const [comments, setComments] = useState<MockComment[]>(INITIAL_COMMENTS);
  const [selection, setSelection] = useState<LineRange | null>(null);
  const [activeCommentId, setActiveCommentId] = useState<number | null>(1);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState('');

  const activeComment = comments.find((comment) => comment.id === activeCommentId) ?? null;
  const lineCount = useMemo(() => Math.max(1, code.split('\n').length), [code]);
  const codeStyle = resolvedTheme === 'dark' ? oneDark : oneLight;

  const selectedOrCommentedLine = (line: number) => {
    if (selection && line >= selection.start && line <= selection.end) return true;
    return (
      commentsVisible && comments.some((comment) => line >= comment.start && line <= comment.end)
    );
  };

  const handleSelection = () => {
    if (!commentsVisible) return;
    const browserSelection = window.getSelection();
    if (
      !browserSelection ||
      browserSelection.isCollapsed ||
      !browserSelection.anchorNode ||
      !browserSelection.focusNode ||
      !codeAreaRef.current?.contains(browserSelection.anchorNode) ||
      !codeAreaRef.current.contains(browserSelection.focusNode)
    ) {
      return;
    }

    const anchorLine = lineFromNode(browserSelection.anchorNode);
    const focusLine = lineFromNode(browserSelection.focusNode);
    const quote = browserSelection.toString().trim();
    if (anchorLine === null || focusLine === null || !quote) return;

    setSelection({
      start: Math.min(anchorLine, focusLine),
      end: Math.max(anchorLine, focusLine),
      quote: quote.slice(0, 180),
    });
    setActiveCommentId(null);
    setComposing(false);
  };

  const openComposer = (range: LineRange) => {
    setSelection(range);
    setActiveCommentId(null);
    setComposing(true);
    setDraft('');
  };

  const addComment = () => {
    if (!selection || !draft.trim()) return;
    const comment: MockComment = {
      ...selection,
      id: Date.now(),
      author: 'you',
      body: draft.trim(),
      when: 'just now',
    };
    setComments((current) => [...current, comment]);
    setActiveCommentId(comment.id);
    setSelection(null);
    setComposing(false);
    setDraft('');
    window.getSelection()?.removeAllRanges();
  };

  const closeThread = () => {
    setActiveCommentId(null);
    setComposing(false);
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  };

  return (
    <div className="relative size-full min-h-0 overflow-hidden bg-surface-100">
      <div ref={codeAreaRef} onMouseUp={handleSelection} className="absolute inset-0 overflow-auto">
        <SyntaxHighlighter
          language={language}
          style={codeStyle}
          showLineNumbers
          wrapLines
          wrapLongLines={false}
          customStyle={{
            minHeight: '100%',
            margin: 0,
            borderRadius: 0,
            background: 'transparent',
            fontSize: '13px',
            lineHeight: '20px',
            padding: '16px 52px 16px 16px',
          }}
          codeTagProps={{ style: { background: 'transparent' } }}
          lineNumberStyle={{ minWidth: '2.75em', paddingRight: '1em', opacity: 0.45 }}
          lineProps={(lineNumber) => ({
            'data-code-line': lineNumber,
            style: {
              display: 'block',
              minWidth: 'max-content',
              background: selectedOrCommentedLine(lineNumber)
                ? 'hsl(var(--brand-300) / 0.45)'
                : 'transparent',
            },
          })}
        >
          {code || '// No solution code available'}
        </SyntaxHighlighter>

        {commentsVisible &&
          comments.map((comment, index) => (
            <button
              key={comment.id}
              type="button"
              onClick={() => {
                setActiveCommentId(comment.id);
                setSelection(null);
                setComposing(false);
              }}
              className={`absolute right-2 z-10 flex size-6 items-center justify-center rounded-full border text-[11px] font-semibold shadow-sm transition-colors ${
                activeCommentId === comment.id
                  ? 'border-brand-highlight bg-brand-500 text-white'
                  : 'border-border-strong bg-surface-100 text-brand hover:border-brand-highlight'
              }`}
              style={{ top: `${16 + (Math.min(comment.start, lineCount) - 1) * 20}px` }}
              aria-label={`Open comment on lines ${comment.start} to ${comment.end}`}
              title={`Comment on line${comment.start === comment.end ? '' : 's'} ${comment.start}${
                comment.start === comment.end ? '' : `–${comment.end}`
              }`}
            >
              {index + 1}
            </button>
          ))}

        {commentsVisible && selection && !composing && (
          <button
            type="button"
            onClick={() => openComposer(selection)}
            className="absolute right-2 z-20 flex size-7 items-center justify-center rounded-full border border-brand-highlight bg-brand-500 text-white shadow-md hover:brightness-110"
            style={{ top: `${16 + (Math.min(selection.start, lineCount) - 1) * 20}px` }}
            aria-label="Comment on selected code"
            title="Add comment"
          >
            <PlusIcon width="15" height="15" />
          </button>
        )}
      </div>

      {commentsVisible && !selection && !activeComment && !composing && (
        <div className="pointer-events-none absolute right-3 top-3 rounded-md border border-border-default bg-surface-100/95 px-2.5 py-1.5 text-[11px] text-foreground-lighter shadow-sm">
          Select code to add a comment
        </div>
      )}

      {commentsVisible && (activeComment || composing) && (
        <aside className="absolute right-3 top-3 z-30 w-[min(19rem,calc(100%-1.5rem))] rounded-lg border border-border-strong bg-surface-100 shadow-xl">
          <div className="flex items-center justify-between border-b border-border-default px-3 py-2">
            <div className="flex items-center gap-2 text-xs font-medium text-foreground">
              <ChatBubbleIcon width="14" height="14" className="text-brand" />
              {composing
                ? `New comment · line${selection?.start === selection?.end ? '' : 's'} ${
                    selection?.start
                  }${selection?.start === selection?.end ? '' : `–${selection?.end}`}`
                : `Line${activeComment?.start === activeComment?.end ? '' : 's'} ${
                    activeComment?.start
                  }${activeComment?.start === activeComment?.end ? '' : `–${activeComment?.end}`}`}
            </div>
            <button
              type="button"
              onClick={closeThread}
              className="rounded p-1 text-foreground-lighter hover:bg-surface-200 hover:text-foreground"
              aria-label="Close comment"
            >
              <Cross2Icon width="14" height="14" />
            </button>
          </div>

          <div className="p-3">
            <blockquote className="mb-3 border-l-2 border-brand-400 pl-2 text-[11px] leading-relaxed text-foreground-lighter">
              {composing ? selection?.quote : activeComment?.quote}
            </blockquote>

            {activeComment && !composing ? (
              <div>
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold text-foreground">
                    @{activeComment.author}
                  </span>
                  <span className="text-[10px] text-foreground-lighter">{activeComment.when}</span>
                </div>
                <p className="text-xs leading-relaxed text-foreground-light">
                  {activeComment.body}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelection(activeComment);
                    setComposing(true);
                    setDraft('');
                  }}
                  className="mt-3 text-xs font-medium text-brand hover:underline"
                >
                  Reply
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Add a comment…"
                  autoFocus
                  rows={3}
                  className="w-full resize-none rounded-md border border-border-strong bg-background px-2.5 py-2 text-xs text-foreground placeholder:text-foreground-lighter focus:border-brand-highlight focus:outline-none"
                />
                <div className="flex justify-end gap-2">
                  <Button type="default" size="tiny" onClick={closeThread}>
                    Cancel
                  </Button>
                  <Button type="primary" size="tiny" onClick={addComment} disabled={!draft.trim()}>
                    Comment
                  </Button>
                </div>
              </div>
            )}
          </div>
          <div className="border-t border-border-default px-3 py-2 text-[10px] text-foreground-lighter">
            Preview only · comments are not saved
          </div>
        </aside>
      )}
    </div>
  );
}
