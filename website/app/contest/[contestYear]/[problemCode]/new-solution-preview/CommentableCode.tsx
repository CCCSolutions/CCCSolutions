'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { ChevronRightIcon, Cross2Icon, PlusIcon } from '@radix-ui/react-icons';
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
};

type MockComment = LineRange & {
  id: number;
  author: string;
  body: string;
  when: string;
  replies: string[];
};

const INITIAL_COMMENTS: MockComment[] = [
  {
    id: 1,
    start: 6,
    end: 6,
    author: 'mnop',
    body: 'Could we mention why this comparison is sufficient? It took me a second to connect it to the problem statement.',
    when: '8 min ago',
    replies: [],
  },
  {
    id: 2,
    start: 7,
    end: 7,
    author: 'william',
    body: 'It may help to name this value as the number of tickets left after both deductions.',
    when: '3 min ago',
    replies: [],
  },
];

function lineFromNode(node: Node | null): number | null {
  const element = node instanceof Element ? node : node?.parentElement;
  const line = element?.closest('[data-code-line]')?.getAttribute('data-code-line');
  if (!line) return null;
  const parsed = Number(line);
  return Number.isFinite(parsed) ? parsed : null;
}

function lineLabel(range: LineRange): string {
  return range.start === range.end ? `Line ${range.start}` : `Lines ${range.start}–${range.end}`;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function CommentableCode({
  code,
  language,
  commentsVisible,
  onCloseComments,
  railWidth,
  onRailWidthChange,
}: {
  code: string;
  language: string;
  commentsVisible: boolean;
  onCloseComments: () => void;
  railWidth: number;
  onRailWidthChange: (width: number) => void;
}) {
  const { resolvedTheme } = useTheme();
  const workspaceRef = useRef<HTMLDivElement>(null);
  const codeAreaRef = useRef<HTMLDivElement>(null);
  const [comments, setComments] = useState<MockComment[]>(INITIAL_COMMENTS);
  const [selection, setSelection] = useState<LineRange | null>(null);
  const [activeCommentId, setActiveCommentId] = useState<number | null>(null);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState('');
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyDraft, setReplyDraft] = useState('');

  const lineCount = useMemo(() => Math.max(1, code.split('\n').length), [code]);
  const codeStyle = resolvedTheme === 'dark' ? oneDark : oneLight;

  useEffect(() => {
    if (commentsVisible) return;
    setSelection(null);
    setActiveCommentId(null);
    setComposing(false);
    setReplyingToId(null);
    window.getSelection()?.removeAllRanges();
  }, [commentsVisible]);

  const commentForLine = (line: number) =>
    comments.find((comment) => line >= comment.start && line <= comment.end);

  const lineBackground = (line: number) => {
    if (selection && line >= selection.start && line <= selection.end) {
      return 'hsl(var(--brand-300) / 0.72)';
    }

    const comment = commentForLine(line);
    if (!commentsVisible || !comment) return 'transparent';
    return comment.id === activeCommentId
      ? 'hsl(var(--brand-300) / 0.72)'
      : 'hsl(var(--brand-300) / 0.34)';
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
    if (anchorLine === null || focusLine === null || !browserSelection.toString().trim()) return;

    setSelection({
      start: Math.min(anchorLine, focusLine),
      end: Math.max(anchorLine, focusLine),
    });
    setActiveCommentId(null);
    setComposing(false);
    setReplyingToId(null);
  };

  const activateComment = (id: number) => {
    setActiveCommentId(id);
    setSelection(null);
    setComposing(false);
    setReplyingToId(null);
    window.getSelection()?.removeAllRanges();
  };

  const openComposer = () => {
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
      replies: [],
    };
    setComments((current) => [...current, comment]);
    setActiveCommentId(comment.id);
    setSelection(null);
    setComposing(false);
    setDraft('');
    window.getSelection()?.removeAllRanges();
  };

  const cancelComposer = () => {
    setComposing(false);
    setSelection(null);
    setDraft('');
    window.getSelection()?.removeAllRanges();
  };

  const addReply = (commentId: number) => {
    if (!replyDraft.trim()) return;
    setComments((current) =>
      current.map((comment) =>
        comment.id === commentId
          ? { ...comment, replies: [...comment.replies, replyDraft.trim()] }
          : comment
      )
    );
    setReplyingToId(null);
    setReplyDraft('');
  };

  const startRailResize = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const workspace = workspaceRef.current;
    if (!workspace) return;
    const rect = workspace.getBoundingClientRect();
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';

    const move = (pointerEvent: PointerEvent) => {
      const maxWidth = Math.max(176, Math.min(440, rect.width * 0.5, rect.width - 180));
      onRailWidthChange(clamp(rect.right - pointerEvent.clientX, 176, maxWidth));
    };
    const stop = () => {
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
  };

  return (
    <div ref={workspaceRef} className="flex size-full min-h-0 overflow-hidden bg-surface-100">
      <div
        ref={codeAreaRef}
        onMouseUp={handleSelection}
        className="relative min-w-0 flex-1 overflow-auto"
      >
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
            padding: '16px 48px 16px 16px',
          }}
          codeTagProps={{ style: { background: 'transparent' } }}
          lineNumberStyle={{ minWidth: '2.75em', paddingRight: '1em', opacity: 0.45 }}
          lineProps={(lineNumber) => ({
            'data-code-line': lineNumber,
            onClick: () => {
              const browserSelection = window.getSelection();
              if (browserSelection && !browserSelection.isCollapsed) return;
              const comment = commentForLine(lineNumber);
              if (commentsVisible && comment) activateComment(comment.id);
            },
            style: {
              display: 'block',
              minWidth: 'max-content',
              cursor: commentsVisible && commentForLine(lineNumber) ? 'pointer' : 'text',
              background: lineBackground(lineNumber),
            },
          })}
        >
          {code || '// No solution code available'}
        </SyntaxHighlighter>

        {commentsVisible && selection && !composing && (
          <button
            type="button"
            onClick={openComposer}
            className="absolute right-2 z-20 flex size-7 items-center justify-center rounded-full border border-brand-highlight bg-brand-500 text-white shadow-md hover:brightness-110"
            style={{ top: `${16 + (Math.min(selection.start, lineCount) - 1) * 20}px` }}
            aria-label={`Comment on ${lineLabel(selection).toLowerCase()}`}
            title="Add comment"
          >
            <PlusIcon width="15" height="15" />
          </button>
        )}
      </div>

      {commentsVisible && (
        <>
          <button
            type="button"
            role="separator"
            aria-label="Resize comments"
            aria-orientation="vertical"
            aria-valuemin={176}
            aria-valuemax={440}
            aria-valuenow={Math.round(railWidth)}
            onPointerDown={startRailResize}
            onKeyDown={(event) => {
              if (event.key === 'ArrowLeft') {
                onRailWidthChange(clamp(railWidth + 16, 176, 440));
              }
              if (event.key === 'ArrowRight') {
                onRailWidthChange(clamp(railWidth - 16, 176, 440));
              }
            }}
            className="group relative w-3 shrink-0 touch-none cursor-col-resize focus:outline-none"
          >
            <span className="absolute inset-y-2 left-1/2 w-px -translate-x-1/2 bg-border-strong transition-colors group-hover:bg-brand-400 group-focus:bg-brand-400" />
          </button>
          <aside
            className="flex min-w-44 max-w-[50%] shrink-0 flex-col overflow-hidden bg-background"
            style={{ width: `${railWidth}px` }}
            aria-label="Inline comments"
          >
            <div className="flex h-10 shrink-0 items-center justify-between border-b border-border-default px-3">
              <span className="text-xs font-semibold text-foreground">Comments</span>
              <button
                type="button"
                onClick={onCloseComments}
                className="rounded p-1.5 text-foreground-lighter transition-colors hover:bg-surface-200 hover:text-foreground"
                aria-label="Close comments"
                title="Close comments"
              >
                <ChevronRightIcon width="14" height="14" />
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2">
              {comments.map((comment) => {
                const active = comment.id === activeCommentId;
                const replying = comment.id === replyingToId;

                return (
                  <article
                    key={comment.id}
                    onClick={() => activateComment(comment.id)}
                    className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                      active
                        ? 'border-brand-highlight bg-surface-200 shadow-sm'
                        : 'border-border-default bg-surface-100 hover:border-border-strong'
                    }`}
                  >
                    <div className="mb-2 flex items-baseline justify-between gap-2">
                      <span className="text-xs font-semibold text-foreground">
                        @{comment.author}
                      </span>
                      <span className="shrink-0 text-[10px] text-foreground-lighter">
                        {comment.when}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-foreground-light">{comment.body}</p>

                    {comment.replies.map((reply, index) => (
                      <div
                        key={`${comment.id}-reply-${index}`}
                        className="mt-3 border-l-2 border-border-strong pl-2"
                      >
                        <span className="text-[11px] font-semibold text-foreground">@you</span>
                        <p className="mt-0.5 text-xs leading-relaxed text-foreground-light">
                          {reply}
                        </p>
                      </div>
                    ))}

                    {replying ? (
                      <div className="mt-3 space-y-2" onClick={(event) => event.stopPropagation()}>
                        <textarea
                          value={replyDraft}
                          onChange={(event) => setReplyDraft(event.target.value)}
                          placeholder="Reply…"
                          autoFocus
                          rows={2}
                          className="w-full resize-none rounded-md border border-border-strong bg-background px-2.5 py-2 text-xs text-foreground placeholder:text-foreground-lighter focus:border-brand-highlight focus:outline-none"
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            type="default"
                            size="tiny"
                            onClick={() => {
                              setReplyingToId(null);
                              setReplyDraft('');
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="primary"
                            size="tiny"
                            onClick={() => addReply(comment.id)}
                            disabled={!replyDraft.trim()}
                          >
                            Reply
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          activateComment(comment.id);
                          setReplyingToId(comment.id);
                          setReplyDraft('');
                        }}
                        className="mt-2 text-xs font-medium text-brand hover:underline"
                      >
                        Reply
                      </button>
                    )}
                  </article>
                );
              })}

              {composing && selection && (
                <article className="rounded-lg border border-brand-highlight bg-surface-100 p-3 shadow-sm">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      New comment · {lineLabel(selection)}
                    </span>
                    <button
                      type="button"
                      onClick={cancelComposer}
                      className="rounded p-1 text-foreground-lighter hover:bg-surface-200 hover:text-foreground"
                      aria-label="Cancel comment"
                    >
                      <Cross2Icon width="13" height="13" />
                    </button>
                  </div>
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Add a comment…"
                    autoFocus
                    rows={3}
                    className="w-full resize-none rounded-md border border-border-strong bg-background px-2.5 py-2 text-xs text-foreground placeholder:text-foreground-lighter focus:border-brand-highlight focus:outline-none"
                  />
                  <div className="mt-2 flex justify-end gap-2">
                    <Button type="default" size="tiny" onClick={cancelComposer}>
                      Cancel
                    </Button>
                    <Button
                      type="primary"
                      size="tiny"
                      onClick={addComment}
                      disabled={!draft.trim()}
                    >
                      Comment
                    </Button>
                  </div>
                </article>
              )}
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
