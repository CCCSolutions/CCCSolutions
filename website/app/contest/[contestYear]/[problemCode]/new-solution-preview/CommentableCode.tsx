'use client';

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { ChevronRightIcon, Cross2Icon } from '@radix-ui/react-icons';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from '../../../../../components/ui/button';

const SyntaxHighlighter = dynamic(
  () => import('react-syntax-highlighter').then((mod) => mod.Prism),
  {
    ssr: false,
    loading: () => <div className="p-4 text-sm text-foreground-lighter">Loading code…</div>,
  }
);

type TextRange = {
  start: number;
  end: number;
};

type MockComment = TextRange & {
  id: number;
  author: string;
  body: string;
  when: string;
  replies: string[];
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function lineStarts(code: string): number[] {
  const starts = [0];
  for (let index = 0; index < code.length; index += 1) {
    if (code[index] === '\n') starts.push(index + 1);
  }
  return starts;
}

function lineForOffset(starts: number[], offset: number): number {
  let line = 0;
  while (line + 1 < starts.length && starts[line + 1] <= offset) line += 1;
  return line;
}

function rangeLabel(code: string, range: TextRange): string {
  const starts = lineStarts(code);
  const first = lineForOffset(starts, range.start) + 1;
  const last = lineForOffset(starts, Math.max(range.start, range.end - 1)) + 1;
  return first === last ? `Line ${first}` : `Lines ${first}–${last}`;
}

function commentTarget(code: string, range: TextRange): TextRange {
  if (range.end > range.start || code.length === 0) return range;
  const start = Math.min(range.start, code.length - 1);
  return { start, end: start + 1 };
}

function fallbackRange(code: string, preferredLine: number): TextRange {
  const lines = code.split('\n');
  const lineIndex = clamp(preferredLine - 1, 0, Math.max(0, lines.length - 1));
  const starts = lineStarts(code);
  const line = lines[lineIndex] ?? '';
  const firstCharacter = line.search(/\S/);
  const start = starts[lineIndex] + Math.max(0, firstCharacter);
  const available = Math.max(1, line.trimStart().length);
  return { start, end: Math.min(code.length, start + Math.min(available, 12)) };
}

function findRange(code: string, patterns: RegExp[], fallbackLine: number): TextRange {
  for (const pattern of patterns) {
    const match = pattern.exec(code);
    if (match?.index !== undefined) {
      return { start: match.index, end: match.index + match[0].length };
    }
  }
  return fallbackRange(code, fallbackLine);
}

function findLastRange(code: string, patterns: RegExp[], fallbackLine: number): TextRange {
  for (const pattern of patterns) {
    const matches = Array.from(code.matchAll(new RegExp(pattern.source, `${pattern.flags}g`)));
    const match = matches.at(-1);
    if (match?.index !== undefined) {
      return { start: match.index, end: match.index + match[0].length };
    }
  }
  return fallbackRange(code, fallbackLine);
}

function initialComments(code: string): MockComment[] {
  return [
    {
      id: 2,
      ...findLastRange(code, [/t\s*-\s*p\s*-\s*b/i, /T\s*-\s*P\s*-\s*B/i], 7),
      author: 'william',
      body: 'It may help to name this value as the number of tickets left after both deductions.',
      when: '3 min ago',
      replies: [],
    },
    {
      id: 1,
      ...findRange(code, [/t\s*-\s*p\s*<\s*b/i, /\(?T\s*-\s*P\s*-\s*B\)?\s*>=\s*0/i], 6),
      author: 'mnop',
      body: 'Could we mention why this comparison is sufficient? It took me a second to connect it to the problem statement.',
      when: '8 min ago',
      replies: [],
    },
  ];
}

function codeTextNodes(line: Element): Text[] {
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    const text = node as Text;
    if (!text.parentElement?.closest('.react-syntax-highlighter-line-number')) nodes.push(text);
    node = walker.nextNode();
  }
  return nodes;
}

function sourceOffsetFromDom(code: string, node: Node, offset: number): number | null {
  const element = node instanceof Element ? node : node.parentElement;
  const line = element?.closest('[data-code-line]');
  const lineNumber = Number(line?.getAttribute('data-code-line'));
  if (!line || !Number.isFinite(lineNumber)) return null;

  const starts = lineStarts(code);
  const sourceLine = code.split('\n')[lineNumber - 1] ?? '';
  const prefix = document.createRange();
  prefix.selectNodeContents(line);
  try {
    prefix.setEnd(node, offset);
  } catch {
    return starts[lineNumber - 1] ?? null;
  }
  const numberLength = line.querySelector('.react-syntax-highlighter-line-number')?.textContent
    ?.length;
  const character = clamp(prefix.toString().length - (numberLength ?? 0), 0, sourceLine.length);
  return (starts[lineNumber - 1] ?? 0) + character;
}

function domPointForOffset(root: HTMLElement, code: string, offset: number) {
  const starts = lineStarts(code);
  const safeOffset = clamp(offset, 0, code.length);
  const lineIndex = lineForOffset(starts, safeOffset);
  const line = root.querySelector(`[data-code-line="${lineIndex + 1}"]`);
  if (!line) return null;

  let remaining = safeOffset - starts[lineIndex];
  const nodes = codeTextNodes(line);
  for (const node of nodes) {
    if (remaining <= node.data.length) return { node, offset: remaining };
    remaining -= node.data.length;
  }
  const last = nodes.at(-1);
  return last ? { node: last, offset: last.data.length } : null;
}

function domRangeForText(root: HTMLElement, code: string, range: TextRange): Range | null {
  const start = domPointForOffset(root, code, range.start);
  const end = domPointForOffset(root, code, range.end);
  if (!start || !end) return null;
  const domRange = document.createRange();
  domRange.setStart(start.node, start.offset);
  domRange.setEnd(end.node, end.offset);
  return domRange;
}

function CommentBody({ children }: { children: string }) {
  return (
    <p className="whitespace-pre-wrap text-xs leading-relaxed text-foreground-light">{children}</p>
  );
}

export function CommentableCode({
  code,
  language,
  commentsVisible,
  composerRequest,
  onCloseComments,
  railWidth,
  onRailWidthChange,
}: {
  code: string;
  language: string;
  commentsVisible: boolean;
  composerRequest: number;
  onCloseComments: () => void;
  railWidth: number;
  onRailWidthChange: (width: number) => void;
}) {
  const { resolvedTheme } = useTheme();
  const highlightId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const highlightNames = useMemo(
    () => ({
      comments: `ccc-comments-${highlightId}`,
      active: `ccc-comment-active-${highlightId}`,
      target: `ccc-comment-target-${highlightId}`,
    }),
    [highlightId]
  );
  const workspaceRef = useRef<HTMLDivElement>(null);
  const codeAreaRef = useRef<HTMLDivElement>(null);
  const handledComposerRequest = useRef(composerRequest);
  const [comments, setComments] = useState<MockComment[]>(() => initialComments(code));
  const [target, setTarget] = useState<TextRange>({ start: 0, end: 0 });
  const [activeCommentId, setActiveCommentId] = useState<number | null>(null);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState('');
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [caretRect, setCaretRect] = useState<{
    left: number;
    top: number;
    height: number;
  } | null>(null);

  const codeStyle = resolvedTheme === 'dark' ? oneDark : oneLight;

  useEffect(() => {
    if (commentsVisible) return;
    setActiveCommentId(null);
    setComposing(false);
    setReplyingToId(null);
  }, [commentsVisible]);

  useEffect(() => {
    if (composerRequest === handledComposerRequest.current) return;
    handledComposerRequest.current = composerRequest;
    setActiveCommentId(null);
    setReplyingToId(null);
    setDraft('');
    setTarget((current) => commentTarget(code, current));
    setComposing(true);
  }, [code, composerRequest]);

  useEffect(() => {
    const root = codeAreaRef.current;
    if (!root) return;
    const registry = (
      CSS as typeof CSS & {
        highlights?: {
          set: (name: string, highlight: unknown) => void;
          delete: (name: string) => void;
        };
      }
    ).highlights;
    const HighlightConstructor = (
      window as typeof window & { Highlight?: new (...ranges: Range[]) => unknown }
    ).Highlight;
    let frame = 0;

    const updateDecorations = () => {
      if (registry && HighlightConstructor) {
        const regular = commentsVisible
          ? comments
              .filter((comment) => comment.id !== activeCommentId)
              .map((comment) => domRangeForText(root, code, comment))
              .filter((range): range is Range => range !== null)
          : [];
        const active = commentsVisible
          ? comments
              .filter((comment) => comment.id === activeCommentId)
              .map((comment) => domRangeForText(root, code, comment))
              .filter((range): range is Range => range !== null)
          : [];
        const targetRange =
          target.end > target.start && activeCommentId === null
            ? domRangeForText(root, code, target)
            : null;

        registry.delete(highlightNames.comments);
        registry.delete(highlightNames.active);
        registry.delete(highlightNames.target);
        if (regular.length) {
          registry.set(highlightNames.comments, new HighlightConstructor(...regular));
        }
        if (active.length) {
          registry.set(highlightNames.active, new HighlightConstructor(...active));
        }
        if (targetRange) {
          registry.set(highlightNames.target, new HighlightConstructor(targetRange));
        }
      }

      const rootRect = root.getBoundingClientRect();
      const caretPoint = domPointForOffset(root, code, target.end);
      if (!caretPoint) {
        setCaretRect(null);
        return;
      }
      const caretRange = document.createRange();
      caretRange.setStart(caretPoint.node, caretPoint.offset);
      caretRange.collapse(true);
      let rect = caretRange.getBoundingClientRect();
      let caretLeft = rect.left;

      if (rect.height <= 0) {
        const probeStart = target.end < code.length ? target.end : Math.max(0, target.end - 1);
        const probeEnd = Math.min(code.length, probeStart + 1);
        const probe = domRangeForText(root, code, { start: probeStart, end: probeEnd });
        const probeRect = probe?.getClientRects()[0];
        if (!probeRect) {
          setCaretRect(null);
          return;
        }
        rect = probeRect;
        caretLeft = target.end < code.length ? rect.left : rect.right;
      }

      setCaretRect({
        left: caretLeft - rootRect.left + root.scrollLeft,
        top: rect.top - rootRect.top + root.scrollTop,
        height: rect.height,
      });
    };

    const scheduleUpdate = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateDecorations);
    };
    const resizeObserver = new ResizeObserver(scheduleUpdate);
    const mutationObserver = new MutationObserver((mutations) => {
      const codeChanged = mutations.some((mutation) =>
        Array.from(mutation.addedNodes).some(
          (node) =>
            node instanceof Element &&
            (node.matches('[data-code-line]') || node.querySelector('[data-code-line]'))
        )
      );
      if (codeChanged) scheduleUpdate();
    });
    resizeObserver.observe(root);
    mutationObserver.observe(root, { childList: true, subtree: true });
    window.addEventListener('resize', scheduleUpdate);
    scheduleUpdate();

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('resize', scheduleUpdate);
      registry?.delete(highlightNames.comments);
      registry?.delete(highlightNames.active);
      registry?.delete(highlightNames.target);
    };
  }, [activeCommentId, code, comments, commentsVisible, highlightNames, target]);

  const handleSelection = (event: React.MouseEvent<HTMLDivElement>) => {
    const browserSelection = window.getSelection();
    const codeArea = codeAreaRef.current;
    let nextTarget: TextRange | null = null;

    if (browserSelection && !browserSelection.isCollapsed && codeArea) {
      const nativeRange = browserSelection.getRangeAt(0);
      if (
        codeArea.contains(nativeRange.startContainer) &&
        codeArea.contains(nativeRange.endContainer)
      ) {
        const start = sourceOffsetFromDom(
          code,
          nativeRange.startContainer,
          nativeRange.startOffset
        );
        const end = sourceOffsetFromDom(code, nativeRange.endContainer, nativeRange.endOffset);
        if (start !== null && end !== null && end > start) nextTarget = { start, end };
      }
    }

    if (!nextTarget) {
      const documentWithCaret = document as Document & {
        caretPositionFromPoint?: (x: number, y: number) => CaretPosition | null;
        caretRangeFromPoint?: (x: number, y: number) => Range | null;
      };
      const caretPosition = documentWithCaret.caretPositionFromPoint?.(
        event.clientX,
        event.clientY
      );
      const fallbackRange = documentWithCaret.caretRangeFromPoint?.(event.clientX, event.clientY);
      const node = caretPosition?.offsetNode ?? fallbackRange?.startContainer;
      const offset = caretPosition?.offset ?? fallbackRange?.startOffset;
      if (node && offset !== undefined) {
        const sourceOffset = sourceOffsetFromDom(code, node, offset);
        if (sourceOffset !== null) nextTarget = { start: sourceOffset, end: sourceOffset };
      }
    }

    if (!nextTarget) return;
    setTarget(nextTarget);
    const comment = comments.find(
      (entry) => nextTarget.start >= entry.start && nextTarget.start <= entry.end
    );
    setActiveCommentId(commentsVisible ? (comment?.id ?? null) : null);
    setReplyingToId(null);
    browserSelection?.removeAllRanges();
  };

  const activateComment = (id: number) => {
    const comment = comments.find((entry) => entry.id === id);
    if (comment) setTarget({ start: comment.start, end: comment.end });
    setActiveCommentId(id);
    setComposing(false);
    setReplyingToId(null);
    window.getSelection()?.removeAllRanges();
  };

  const addComment = () => {
    if (!draft.trim()) return;
    const range = commentTarget(code, target);
    const comment: MockComment = {
      ...range,
      id: Date.now(),
      author: 'you',
      body: draft.trim(),
      when: 'just now',
      replies: [],
    };
    setComments((current) => [comment, ...current]);
    setTarget(range);
    setActiveCommentId(comment.id);
    setComposing(false);
    setDraft('');
    window.getSelection()?.removeAllRanges();
  };

  const cancelComposer = () => {
    setComposing(false);
    setDraft('');
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
      <style>{`
        ::highlight(${highlightNames.comments}) {
          background-color: hsl(var(--warning-600) / 0.28);
        }
        ::highlight(${highlightNames.active}),
        ::highlight(${highlightNames.target}) {
          background-color: hsl(var(--warning-600) / 0.48);
        }
        @keyframes ccc-comment-caret-flash {
          0%, 49% { visibility: visible; }
          50%, 100% { visibility: hidden; }
        }
      `}</style>
      <div
        ref={codeAreaRef}
        onMouseUp={handleSelection}
        className="relative min-w-0 flex-1 cursor-text overflow-auto"
      >
        <div className="pointer-events-none absolute inset-0 z-[2]" aria-hidden="true">
          {caretRect && (
            <span
              className="absolute w-0.5 bg-brand-500"
              style={{
                left: caretRect.left,
                top: caretRect.top,
                height: caretRect.height,
                animation: 'ccc-comment-caret-flash 1s step-end infinite',
              }}
            />
          )}
        </div>
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
            position: 'relative',
            zIndex: 1,
          }}
          codeTagProps={{ style: { background: 'transparent' } }}
          lineNumberStyle={{ minWidth: '2.75em', paddingRight: '1em', opacity: 0.45 }}
          lineProps={(lineNumber) => ({
            'data-code-line': lineNumber,
            style: {},
          })}
        >
          {code || '// No solution code available'}
        </SyntaxHighlighter>
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
            {composing && (
              <div className="shrink-0 border-b border-border-default p-2">
                <article className="rounded-lg border border-brand-highlight bg-surface-100 p-3 shadow-sm">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      New comment · {rangeLabel(code, target)}
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
                  {target.end > target.start && (
                    <p className="mb-2 line-clamp-2 border-l-2 border-brand-400 pl-2 font-mono text-[10px] text-foreground-lighter">
                      {code.slice(target.start, target.end)}
                    </p>
                  )}
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
              </div>
            )}
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
                    <CommentBody>{comment.body}</CommentBody>

                    {comment.replies.map((reply, index) => (
                      <div
                        key={`${comment.id}-reply-${index}`}
                        className="mt-3 border-l-2 border-border-strong pl-2"
                      >
                        <span className="text-[11px] font-semibold text-foreground">@you</span>
                        <div className="mt-0.5">
                          <CommentBody>{reply}</CommentBody>
                        </div>
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
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
