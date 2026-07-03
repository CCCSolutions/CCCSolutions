'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CheckCircledIcon,
  Share1Icon,
  ExclamationTriangleIcon,
  ChatBubbleIcon,
} from '@radix-ui/react-icons';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { SectionContainer } from '../../../../components/ui/section-container';

// FIXME: visual mockup, not real feature code — no backend wired up, votes/
// replies below don't persist. Inspo for the real thread-view build.

// ─── Mock thread data ──────────────────────────────────────────────────────

const thread = {
  title: '2024 S4: is the official editorial wrong about the complexity?',
  isQuestion: true,
  hasAccepted: false,
  votes: 18,
  views: 287,
  asked: '6 hours ago',
  lastActivity: '12 minutes ago',
  body: `The editorial claims **O(N log N)** but the suggested approach uses a segment tree per node which would naively be O(N log² N).

Specifically, the editorial walks through:

1. Build a segment tree over the array
2. For each query, perform a binary search inside the segment tree

If both the outer iteration and the inner segment tree are log N, that should multiply, not add. Am I missing something? Is there an implicit fractional cascading / parallel binary search trick the editorial assumes?

I tried both implementations on the official test data:
- O(N log² N) implementation: 1.8s on TC 10
- O(N log N) implementation (using fractional cascading): 0.4s on TC 10

The TLE limit is 2s, so technically both pass, but the editorial is misleading.`,
  tags: ['algorithms', 'segment-tree', 'complexity', '2024'],
  author: { name: 'aetherwind', rep: 1240 },
};

type SubReply = {
  id: string;
  votes: number;
  body: string;
  author: { name: string; rep: number };
  when: string;
};

type Answer = {
  id: string;
  votes: number;
  accepted: boolean;
  body: string;
  author: { name: string; rep: number };
  when: string;
  subReplies: SubReply[];
};

const answers: Answer[] = [
  {
    id: 'a1',
    votes: 12,
    accepted: false,
    body: `You're right that the *naive* implementation is O(N log² N). The editorial is being loose with notation.

The trick is that the inner binary search shares structure with the outer iteration. If you precompute prefix/suffix arrays, you can amortize the inner search to O(1) per outer step, bringing the total to O(N log N).

Look at the reference C++ solution at lines 47–63 — there's a \`pre[]\` and \`suf[]\` array being built before the main loop. That's the optimization the editorial doesn't explain.`,
    author: { name: 'kshrestha', rep: 3120 },
    when: '4h ago',
    subReplies: [
      {
        id: 'a1-r1',
        votes: 3,
        body: 'Got it, that pre[]/suf[] trick is exactly what I missed. Going to file an issue against the editorial to clarify.',
        author: { name: 'aetherwind', rep: 1240 },
        when: '3h ago',
      },
      {
        id: 'a1-r2',
        votes: 1,
        body: 'Same trick shows up in 2019 S5 if anyone wants more practice.',
        author: { name: 'minkyu', rep: 540 },
        when: '2h ago',
      },
    ],
  },
  {
    id: 'a2',
    votes: 5,
    accepted: false,
    body: `Adding to @kshrestha's answer — the unstated assumption is that the array values are bounded (≤ 10^6 in this problem). That's what enables the prefix-array trick. If values were unbounded, the editorial's claim genuinely would be wrong.

Worth filing an issue against the editorial to add a sentence about this. The complexity claim isn't wrong, just under-specified.`,
    author: { name: 'minkyu', rep: 540 },
    when: '2h ago',
    subReplies: [],
  },
];

const otherUnanswered = [
  { title: 'Approach for 2021 S2 Modern Art — keep getting WA on TC 7', age: '9 days' },
  { title: '2018 S4 Wrong Answer — clarification on the input format', age: '4 days' },
  { title: 'Why does my segment tree TLE on TC 12 of 2019 S5?', age: '1 day' },
];

// ─── Pills ─────────────────────────────────────────────────────────────────

function TypePill({ isQuestion }: { isQuestion: boolean }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide text-foreground-light bg-surface-200 border border-border-default">
      {isQuestion ? 'Question' : 'Discussion'}
    </span>
  );
}

function TagChip({ tag }: { tag: string }) {
  return (
    <Link
      href="#"
      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium text-foreground-light bg-surface-200 border border-border-default hover:border-border-strong hover:text-foreground"
    >
      #{tag}
    </Link>
  );
}

// ─── Vote column (top-level) ───────────────────────────────────────────────

function VoteColumn({ initial, accepted }: { initial: number; accepted?: boolean }) {
  const [score, setScore] = useState(initial);
  return (
    <div className="flex flex-col items-center gap-0.5 shrink-0 w-10 pt-1">
      <button
        onClick={() => setScore((s) => s + 1)}
        aria-label="Upvote"
        className="text-foreground-lighter hover:text-brand transition-colors"
      >
        <ArrowUpIcon width="20" height="20" />
      </button>
      <span className="text-base font-semibold text-foreground">{score}</span>
      <button
        onClick={() => setScore((s) => s - 1)}
        aria-label="Downvote"
        className="text-foreground-lighter hover:text-destructive transition-colors"
      >
        <ArrowDownIcon width="20" height="20" />
      </button>
      {accepted !== undefined && (
        <button
          aria-label={accepted ? 'Accepted' : 'Mark as accepted'}
          title={accepted ? 'Accepted answer' : 'Asker can mark this as the accepted answer'}
          className={`mt-2 ${
            accepted
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-foreground-muted hover:text-emerald-600'
          }`}
        >
          <CheckCircledIcon width="22" height="22" />
        </button>
      )}
    </div>
  );
}

// ─── Inline mini-vote (sub-replies) ────────────────────────────────────────

function InlineVote({ initial }: { initial: number }) {
  const [score, setScore] = useState(initial);
  return (
    <div className="inline-flex items-center gap-1 text-xs text-foreground-lighter">
      <button
        onClick={() => setScore((s) => s + 1)}
        aria-label="Upvote"
        className="hover:text-brand transition-colors"
      >
        <ArrowUpIcon width="13" height="13" />
      </button>
      <span className="font-medium text-foreground-light min-w-[1ch] text-center">{score}</span>
      <button
        onClick={() => setScore((s) => s - 1)}
        aria-label="Downvote"
        className="hover:text-destructive transition-colors"
      >
        <ArrowDownIcon width="13" height="13" />
      </button>
    </div>
  );
}

// ─── Compact reply composer (collapsed → expanded) ─────────────────────────

function ReplyComposer({
  placeholder,
  submitLabel,
  minChars = 100,
  forceOpen = false,
  onCancel,
  autoFocus = false,
  compact = false,
}: {
  placeholder: string;
  submitLabel: string;
  minChars?: number;
  forceOpen?: boolean;
  onCancel?: () => void;
  autoFocus?: boolean;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(forceOpen);
  const [text, setText] = useState('');
  const isOpen = open || forceOpen;

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full h-10 px-3 rounded-md border border-border-strong bg-surface-100 text-sm text-foreground-lighter text-left hover:border-border-stronger transition-colors"
      >
        {placeholder}
      </button>
    );
  }

  return (
    <div className="rounded-md border border-border-strong bg-surface-100 focus-within:border-brand-highlight transition-colors overflow-hidden">
      <textarea
        autoFocus={autoFocus || forceOpen}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        rows={compact ? 4 : 5}
        className="w-full px-3 pt-3 bg-transparent text-sm text-foreground placeholder:text-foreground-lighter focus:outline-none resize-y"
      />
      <div
        className={`flex items-center justify-end gap-2 ${
          compact ? 'px-3 pb-2.5 pt-1' : 'px-3 pb-3 pt-1.5'
        }`}
      >
        <button
          type="button"
          onClick={() => {
            setText('');
            setOpen(false);
            onCancel?.();
          }}
          className="px-2.5 py-1 text-xs text-foreground-light hover:text-foreground"
        >
          Cancel
        </button>
        <Button type="primary" size="tiny" disabled={text.trim().length < minChars}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

type AnswerSort = 'top' | 'newest' | 'oldest';

export default function ForumThreadPreview() {
  const [sort, setSort] = useState<AnswerSort>('top');
  const [openReplyId, setOpenReplyId] = useState<string | null>(null);

  const sortedAnswers = [...answers].sort((a, b) => {
    if (sort === 'top') return b.votes - a.votes;
    if (sort === 'newest') return a.id < b.id ? 1 : -1;
    return a.id < b.id ? -1 : 1;
  });

  return (
    <div className="bg-background text-foreground">
      <SectionContainer size="large" className="py-8">
        {/* Breadcrumb */}
        <div className="mb-5">
          <Link
            href="/forum/preview/logged-in"
            className="inline-flex items-center gap-1.5 text-sm text-foreground-light hover:text-foreground"
          >
            <ArrowLeftIcon width="14" height="14" />
            Back to forum
          </Link>
          <p className="text-xs text-foreground-lighter mt-3">
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>{' '}
            /{' '}
            <Link href="/forum/preview/logged-in" className="hover:text-foreground">
              Forum
            </Link>
          </p>
        </div>

        {/* Title block */}
        <div className="mb-6">
          <div className="flex items-center gap-1.5 mb-2">
            <TypePill isQuestion={thread.isQuestion} />
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
            {thread.title}
          </h1>
          <div className="mt-2 flex items-center gap-3 text-xs text-foreground-lighter flex-wrap">
            <span>
              Asked <span className="text-foreground-light">{thread.asked}</span>
            </span>
            <span>·</span>
            <span>
              Active <span className="text-foreground-light">{thread.lastActivity}</span>
            </span>
            <span>·</span>
            <span>
              {thread.views} {thread.views === 1 ? 'view' : 'views'}
            </span>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-[1fr_280px] gap-8">
          <main className="min-w-0 flex flex-col gap-6">
            {/* Question body */}
            <Card>
              <div className="flex gap-5 px-5 py-5">
                <VoteColumn initial={thread.votes} />
                <div className="flex-1 min-w-0">
                  <div className="text-foreground-light">
                    {thread.body.split('\n\n').map((para, i) => (
                      <p key={i} className="mb-3 leading-relaxed whitespace-pre-wrap">
                        {para}
                      </p>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-1.5 flex-wrap">
                    {thread.tags.map((tag) => (
                      <TagChip key={tag} tag={tag} />
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-border-default flex items-center justify-between flex-wrap gap-3">
                    <div className="flex gap-3 text-xs">
                      <button className="text-foreground-lighter hover:text-foreground inline-flex items-center gap-1">
                        <Share1Icon width="12" height="12" /> Share
                      </button>
                      <button className="text-foreground-lighter hover:text-destructive inline-flex items-center gap-1">
                        <ExclamationTriangleIcon width="12" height="12" /> Report
                      </button>
                    </div>
                    <span className="text-xs text-foreground-lighter">
                      asked by{' '}
                      <Link href="#" className="text-brand hover:underline">
                        @{thread.author.name}
                      </Link>{' '}
                      · {thread.author.rep.toLocaleString()} rep
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Top-level reply composer (collapsed by default) */}
            <ReplyComposer
              placeholder={thread.isQuestion ? 'Post your answer…' : 'Post your reply…'}
              submitLabel={thread.isQuestion ? 'Post answer' : 'Post reply'}
              minChars={100}
            />

            {/* Answers header + sort pills */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-lg font-semibold text-foreground">
                {answers.length}{' '}
                {answers.length === 1
                  ? thread.isQuestion
                    ? 'Answer'
                    : 'Reply'
                  : thread.isQuestion
                    ? 'Answers'
                    : 'Replies'}
              </h2>
              <div className="flex gap-1">
                {(['top', 'newest', 'oldest'] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSort(key)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      sort === key
                        ? 'bg-surface-200 text-foreground'
                        : 'text-foreground-light hover:bg-surface-200/60 hover:text-foreground'
                    }`}
                  >
                    {key === 'top' ? 'Top' : key === 'newest' ? 'Newest' : 'Oldest'}
                  </button>
                ))}
              </div>
            </div>

            {/* Top-level replies + sub-replies */}
            {sortedAnswers.map((a) => (
              <Card key={a.id}>
                <div className="flex gap-5 px-5 py-5">
                  <VoteColumn initial={a.votes} accepted={a.accepted} />
                  <div className="flex-1 min-w-0">
                    <div className="text-foreground-light leading-relaxed whitespace-pre-wrap">
                      {a.body}
                    </div>
                    <div className="mt-4 pt-3 border-t border-border-default flex items-center justify-between flex-wrap gap-3">
                      <div className="flex gap-3 text-xs items-center">
                        <button
                          type="button"
                          onClick={() => setOpenReplyId((prev) => (prev === a.id ? null : a.id))}
                          className="text-foreground-lighter hover:text-foreground inline-flex items-center gap-1"
                        >
                          <ChatBubbleIcon width="12" height="12" /> Reply
                        </button>
                        <button className="text-foreground-lighter hover:text-foreground inline-flex items-center gap-1">
                          <Share1Icon width="12" height="12" /> Share
                        </button>
                        <button className="text-foreground-lighter hover:text-destructive inline-flex items-center gap-1">
                          <ExclamationTriangleIcon width="12" height="12" /> Report
                        </button>
                      </div>
                      <span className="text-xs text-foreground-lighter">
                        answered <span className="text-foreground-light">{a.when}</span> by{' '}
                        <Link href="#" className="text-brand hover:underline">
                          @{a.author.name}
                        </Link>{' '}
                        · {a.author.rep.toLocaleString()} rep
                      </span>
                    </div>

                    {/* Sub-replies (1-deep, Reddit-style indent) */}
                    {(a.subReplies.length > 0 || openReplyId === a.id) && (
                      <div className="mt-4 pl-4 border-l-2 border-border-default flex flex-col gap-4">
                        {a.subReplies.map((sr) => (
                          <SubReplyView key={sr.id} reply={sr} />
                        ))}
                        {openReplyId === a.id && (
                          <div className="pt-1">
                            <ReplyComposer
                              placeholder={`Reply to @${a.author.name}…`}
                              submitLabel="Post reply"
                              minChars={10}
                              forceOpen
                              autoFocus
                              compact
                              onCancel={() => setOpenReplyId(null)}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </main>

          {/* Right rail */}
          <aside>
            <div className="flex flex-col gap-6">
              <Card>
                <div className="px-4 py-3 border-b border-border-default">
                  <p className="text-[11px] uppercase tracking-wider text-foreground-lighter">
                    Thread info
                  </p>
                </div>
                <dl className="px-4 py-3 text-xs space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-foreground-lighter">Asked</dt>
                    <dd className="text-foreground-light">{thread.asked}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-foreground-lighter">Last activity</dt>
                    <dd className="text-foreground-light">{thread.lastActivity}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-foreground-lighter">Views</dt>
                    <dd className="text-foreground-light">{thread.views}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-foreground-lighter">Score</dt>
                    <dd className="text-foreground-light">{thread.votes}</dd>
                  </div>
                </dl>
              </Card>

              <Card>
                <div className="px-4 py-3 border-b border-border-default">
                  <p className="text-[11px] uppercase tracking-wider text-foreground-lighter">
                    Other open in #segment-tree
                  </p>
                </div>
                <ul className="divide-y divide-border-default">
                  {otherUnanswered.map((u, i) => (
                    <li key={i}>
                      <Link
                        href="#"
                        className="block px-4 py-3 hover:bg-surface-200/50 transition-colors"
                      >
                        <p className="text-xs font-medium text-foreground line-clamp-2 leading-snug">
                          {u.title}
                        </p>
                        <p className="text-[11px] text-foreground-lighter mt-1">
                          unanswered · {u.age}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="px-4 py-2.5 border-t border-border-default">
                  <Link
                    href="/forum/preview/logged-in"
                    className="text-[11px] text-foreground-light hover:text-foreground"
                  >
                    See all open in #segment-tree →
                  </Link>
                </div>
              </Card>
            </div>
          </aside>
        </div>
      </SectionContainer>
    </div>
  );
}

function SubReplyView({ reply }: { reply: SubReply }) {
  return (
    <div>
      <p className="text-sm text-foreground-light leading-relaxed whitespace-pre-wrap">
        {reply.body}
      </p>
      <div className="mt-2 flex items-center gap-3 text-[11px] flex-wrap">
        <InlineVote initial={reply.votes} />
        <span className="text-foreground-lighter">
          <Link href="#" className="text-brand hover:underline">
            @{reply.author.name}
          </Link>{' '}
          · {reply.author.rep.toLocaleString()} rep · {reply.when} ·{' '}
          <button className="hover:text-destructive">Report</button>
        </span>
      </div>
    </div>
  );
}
