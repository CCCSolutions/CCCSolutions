'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MagnifyingGlassIcon, PlusIcon } from '@radix-ui/react-icons';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { SectionContainer } from '../../../../components/ui/section-container';
import { FlickeringGrid } from '../../../../components/effects/FlickeringGrid';
import { AuthProvider, useAuth } from '../../../../components/auth/AuthProvider';

// FIXME: this whole route is a visual mockup, not real feature code — mock
// data below, no real forum backend wired up. Inspo for the real forum build.

type YourPost = {
  title: string;
  kind: 'thread' | 'reply';
  when: string;
  replies?: number;
  href: string;
};

const yourPostsMock: YourPost[] = [
  {
    title: '2024 S4: is the official editorial wrong about the complexity?',
    kind: 'thread',
    when: '6h ago',
    replies: 4,
    href: '/forum/preview/thread',
  },
  {
    title: 'Re: Monotonic stack pattern: when do you actually reach for it?',
    kind: 'reply',
    when: '1d ago',
    href: '/forum/preview/thread',
  },
  {
    title: 'Re: How are you preparing for Senior 2026?',
    kind: 'reply',
    when: '3d ago',
    href: '/forum/preview/thread',
  },
];

// ─── Mock data ─────────────────────────────────────────────────────────────

const popularTags = [
  { tag: 'algorithms', count: 312 },
  { tag: 'ccc-prep', count: 124 },
  { tag: 'dp', count: 87 },
  { tag: 'graphs', count: 64 },
  { tag: 'greedy', count: 51 },
  { tag: 'site-feedback', count: 41 },
  { tag: 'strings', count: 39 },
  { tag: 'segment-tree', count: 22 },
  { tag: 'binary-search', count: 18 },
  { tag: 'number-theory', count: 14 },
];

type Thread = {
  id: string;
  title: string;
  excerpt: string;
  tags: string[];
  votes: number;
  replies: number;
  views: number;
  isQuestion: boolean;
  hasAccepted: boolean;
  user: string;
  rep: number;
  when: string;
  pinned?: boolean;
};

const threads: Thread[] = [
  {
    id: '1',
    title: 'How are you preparing for Senior 2026? Looking for a pacing guide.',
    excerpt:
      "I'm aiming for S5 next year. Currently doing 2 problems a day from past contests but I'm not sure if I should be focusing more on USACO Gold or specific topics like graphs and DP. What's worked for you?",
    tags: ['ccc-prep', 'study-plan'],
    votes: 24,
    replies: 9,
    views: 412,
    isQuestion: false,
    hasAccepted: false,
    user: 'tankman61',
    rep: 8450,
    when: '3h ago',
    pinned: true,
  },
  {
    id: '2',
    title: '2024 S4: is the official editorial wrong about the complexity?',
    excerpt:
      'The editorial claims O(N log N) but the suggested approach uses a segment tree per node which would be O(N log² N). Am I missing something?',
    tags: ['algorithms', 'segment-tree', 'complexity', '2024'],
    votes: 18,
    replies: 4,
    views: 287,
    isQuestion: true,
    hasAccepted: false,
    user: 'aetherwind',
    rep: 1240,
    when: '6h ago',
  },
  {
    id: '3',
    title: 'Monotonic stack pattern: when do you actually reach for it?',
    excerpt:
      "After solving 2023 S3 with a stack, I went back and noticed it's the same trick as histogram-largest-rectangle. Has anyone built a mental list of CCC-style problems where this pattern is the unlock?",
    tags: ['algorithms', 'stack', 'patterns'],
    votes: 31,
    replies: 12,
    views: 905,
    isQuestion: false,
    hasAccepted: false,
    user: 'kshrestha',
    rep: 3120,
    when: '1d ago',
  },
  {
    id: '4',
    title: '1998 S5 Maze: adding a Python solution',
    excerpt:
      "Adding the Python solution that's been missing from this problem for years. BFS with a deque, ~80 lines. Walked through it in the editorial section but happy to discuss tradeoffs vs the C++ version.",
    tags: ['algorithms', '1998', 'bfs', 'python'],
    votes: 15,
    replies: 3,
    views: 198,
    isQuestion: false,
    hasAccepted: false,
    user: 'minkyu',
    rep: 540,
    when: '1d ago',
  },
  {
    id: '5',
    title: 'Search keeps returning the wrong year ordering',
    excerpt:
      'When I filter for senior + year=2018, the 2008 problems also show up. Looks like a substring match instead of exact match on the year column.',
    tags: ['site-feedback', 'bug', 'search'],
    votes: 7,
    replies: 1,
    views: 64,
    isQuestion: true,
    hasAccepted: true,
    user: 'sneha.k',
    rep: 210,
    when: '2d ago',
  },
  {
    id: '6',
    title: '2021 S2 Modern Art: WA on TC 7',
    excerpt:
      "I think there's a closed-form solution but I keep getting WA on TC 7. My current approach is parity counting on rows + columns. Anyone want to take a look?",
    tags: ['algorithms', 'dp', '2021', 'parity'],
    votes: 4,
    replies: 0,
    views: 86,
    isQuestion: true,
    hasAccepted: false,
    user: 'leo.w',
    rep: 80,
    when: '9d ago',
  },
  {
    id: '7',
    title: 'Should we add a "verified on DMOJ" badge next to usernames in threads?',
    excerpt:
      "Right now the linked-DMOJ-handle thing only shows on profiles. It'd make threads way more credible if I could see at a glance whether the answerer has actually AC'd the problem they're discussing.",
    tags: ['site-feedback', 'suggestion', 'profiles'],
    votes: 22,
    replies: 6,
    views: 301,
    isQuestion: false,
    hasAccepted: false,
    user: 'tankman61',
    rep: 8450,
    when: '4d ago',
  },
];

// ─── Pills ─────────────────────────────────────────────────────────────────

function TypePill({ isQuestion }: { isQuestion: boolean }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide text-foreground-light bg-surface-200 border border-border-default">
      {isQuestion ? 'Question' : 'Discussion'}
    </span>
  );
}

function PinnedPill() {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900">
      Pinned
    </span>
  );
}

function TagChip({ tag, small = false }: { tag: string; small?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded text-foreground-light bg-surface-200 border border-border-default font-medium ${
        small ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]'
      }`}
    >
      #{tag}
    </span>
  );
}

// ─── Stats ─────────────────────────────────────────────────────────────────

function StatLine({
  value,
  label,
  boxed = false,
}: {
  value: number;
  label: string;
  boxed?: boolean;
}) {
  if (boxed) {
    return (
      <div className="inline-flex items-baseline gap-1 px-2 py-1 rounded border border-emerald-500 dark:border-emerald-600 text-emerald-700 dark:text-emerald-400">
        <span className="text-sm font-semibold">{value.toLocaleString()}</span>
        <span className="text-[11px]">{label}</span>
      </div>
    );
  }
  return (
    <div className="inline-flex items-baseline gap-1 px-2 py-1">
      <span className="text-sm font-semibold text-foreground">{value.toLocaleString()}</span>
      <span className="text-[11px] text-foreground-lighter">{label}</span>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

type SortKey = 'recent' | 'top' | 'unanswered';

const sortLabels: Record<SortKey, string> = {
  recent: 'Recent',
  top: 'Top',
  unanswered: 'Unanswered',
};

export default function ForumLoggedInPreview() {
  return (
    <AuthProvider>
      <ForumLoggedInPreviewContent />
    </AuthProvider>
  );
}

// FIXME: real login-state read via AuthProvider — this stays fine once the
// real forum lands, but everything it renders below is still mockup content.
function ForumLoggedInPreviewContent() {
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<SortKey>('recent');
  const { state } = useAuth();

  const toggleTag = (value: string) => {
    setActiveTags((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const filtered = threads.filter((t) => {
    if (activeTags.size > 0 && !Array.from(activeTags).every((tag) => t.tags.includes(tag)))
      return false;
    if (sort === 'unanswered' && t.replies > 0) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    if (sort === 'top') return b.votes - a.votes;
    return 0;
  });

  return (
    <div className="bg-background text-foreground">
      {/* Blue hero */}
      <div
        data-theme="dark"
        className="relative bg-blue-950 overflow-hidden border-b border-border-default"
      >
        <div aria-hidden className="absolute inset-0 z-0 pointer-events-none">
          <FlickeringGrid
            className="size-full"
            squareSize={4}
            gridGap={6}
            color="hsl(239, 84%, 67%)"
            maxOpacity={0.12}
            flickerChance={0.03}
          />
        </div>
        <SectionContainer size="large" className="relative z-10 pt-14 pb-10">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white">Forum</h1>
          <p className="mt-3 text-base md:text-lg text-white/75 max-w-2xl">
            Ask, search, or answer any question related to the CCC.
          </p>
        </SectionContainer>
      </div>

      <SectionContainer size="large" className="py-10">
        <div className="grid lg:grid-cols-[240px_1fr] gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="flex flex-col gap-6">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-foreground-lighter mb-2 px-2">
                  Popular tags
                </p>
                <div className="flex flex-wrap gap-1.5 px-2">
                  {popularTags.map((t) => (
                    <TagButton
                      key={t.tag}
                      tag={t.tag}
                      count={t.count}
                      active={activeTags.has(t.tag)}
                      onClick={() => toggleTag(t.tag)}
                    />
                  ))}
                </div>
              </div>

              {state === 'in' && <YourPostsBlock posts={yourPostsMock} />}
              {state === 'out' && <SignUpBlock />}
            </div>
          </aside>

          {/* Main */}
          <main className="min-w-0">
            <div className="relative mb-4">
              <MagnifyingGlassIcon
                width="16"
                height="16"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-lighter pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search threads, comments, code..."
                className="w-full h-10 pl-10 pr-16 rounded-md border border-border-strong bg-surface-100 text-sm text-foreground placeholder:text-foreground-lighter focus:outline-none focus:border-brand-highlight"
              />
              <span className="hidden md:inline-flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-1 px-1.5 py-0.5 rounded border border-border-default text-[10px] text-foreground-lighter font-mono">
                ⌘K
              </span>
            </div>

            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex gap-1 flex-wrap">
                {(Object.keys(sortLabels) as SortKey[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSort(key)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                      sort === key
                        ? 'bg-surface-200 text-foreground'
                        : 'text-foreground-light hover:bg-surface-200/60 hover:text-foreground'
                    }`}
                  >
                    {sortLabels[key]}
                  </button>
                ))}
              </div>
              <Button
                asChild
                type="primary"
                size="small"
                className="whitespace-nowrap shrink-0 !pl-2.5"
              >
                <Link href="/forum/preview/new-thread" className="inline-flex items-center gap-1.5">
                  <PlusIcon width={14} height={14} />
                  New thread
                </Link>
              </Button>
            </div>

            {activeTags.size > 0 && (
              <div className="flex items-center gap-2 mb-3 text-xs text-foreground-light flex-wrap">
                <span>Filters:</span>
                {Array.from(activeTags).map((t) => (
                  <button
                    key={`t-${t}`}
                    onClick={() => toggleTag(t)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-border-default bg-surface-100 hover:border-border-strong"
                  >
                    #{t} <span className="text-foreground-lighter">×</span>
                  </button>
                ))}
                <button
                  onClick={() => setActiveTags(new Set())}
                  className="text-foreground-lighter hover:text-foreground underline ml-1"
                >
                  Clear all
                </button>
              </div>
            )}

            <Card>
              <ul className="divide-y divide-border-default">
                {sorted.length === 0 && (
                  <li className="px-5 py-12 text-center text-sm text-foreground-light">
                    No threads match your filters.
                  </li>
                )}
                {sorted.map((t) => (
                  <li key={t.id}>
                    <Link
                      href="/forum/preview/thread"
                      className={`flex gap-5 px-5 py-4 hover:bg-surface-200/50 transition-colors border-l-2 ${
                        t.pinned ? 'border-l-amber-500' : 'border-l-transparent'
                      }`}
                    >
                      <div className="flex flex-col items-end gap-1 shrink-0 w-[110px]">
                        <StatLine value={t.votes} label={t.votes === 1 ? 'vote' : 'votes'} />
                        <StatLine
                          value={t.replies}
                          label={
                            t.isQuestion
                              ? t.replies === 1
                                ? 'answer'
                                : 'answers'
                              : t.replies === 1
                                ? 'reply'
                                : 'replies'
                          }
                          boxed={t.isQuestion && t.hasAccepted}
                        />
                        <StatLine value={t.views} label={t.views === 1 ? 'view' : 'views'} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                          <TypePill isQuestion={t.isQuestion} />
                          {t.pinned && <PinnedPill />}
                        </div>
                        <h3 className="text-base font-semibold text-foreground truncate">
                          {t.title}
                        </h3>
                        <p className="text-xs text-foreground-light mt-1 line-clamp-2 leading-relaxed">
                          {t.excerpt}
                        </p>
                        <div className="mt-2 flex items-center gap-2 flex-wrap text-[11px]">
                          <div className="flex gap-1.5 flex-wrap">
                            {t.tags.map((tag) => (
                              <TagChip key={tag} tag={tag} small />
                            ))}
                          </div>
                          <span className="text-foreground-lighter ml-auto whitespace-nowrap">
                            @{t.user} · {t.rep.toLocaleString()} rep · {t.when}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>

            <div className="flex items-center justify-between mt-5">
              <span className="text-xs text-foreground-lighter">
                Showing {sorted.length} of {threads.length} threads
              </span>
              <div className="flex gap-1.5">
                <Button type="default" size="tiny" disabled>
                  ← Prev
                </Button>
                <Button type="default" size="tiny">
                  Next →
                </Button>
              </div>
            </div>
          </main>
        </div>
      </SectionContainer>
    </div>
  );
}

function YourPostsBlock({ posts }: { posts: YourPost[] }) {
  // Mock account stats
  const account = {
    username: 'aetherwind',
    rep: 1240,
    threads: 1,
    replies: 2,
  };

  return (
    <Card>
      <div className="px-4 py-3 border-b border-border-default">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-full bg-brand-200 dark:bg-brand-200/30 border border-brand-300 dark:border-brand-300/40 flex items-center justify-center text-xs font-semibold text-brand shrink-0">
            {account.username.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">@{account.username}</p>
            <p className="text-[11px] text-foreground-lighter">
              {account.rep.toLocaleString()} rep · {account.threads}{' '}
              {account.threads === 1 ? 'thread' : 'threads'} · {account.replies}{' '}
              {account.replies === 1 ? 'reply' : 'replies'}
            </p>
          </div>
        </div>
      </div>
      <div className="px-4 py-3">
        <p className="text-[11px] uppercase tracking-wider text-foreground-lighter mb-2.5">
          Your posts
        </p>
        {posts.length === 0 ? (
          <p className="text-xs text-foreground-light">
            You haven&apos;t posted yet.{' '}
            <Link
              href="/forum/preview/new-thread"
              className="text-brand hover:underline font-medium"
            >
              Start a thread →
            </Link>
          </p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {posts.map((p, i) => (
              <li key={i}>
                <Link href={p.href} className="block group">
                  <p className="text-xs font-medium text-foreground line-clamp-2 leading-snug group-hover:text-brand transition-colors">
                    {p.title}
                  </p>
                  <p className="text-[11px] text-foreground-lighter mt-0.5">
                    {p.kind === 'thread'
                      ? `${p.replies ?? 0} ${p.replies === 1 ? 'reply' : 'replies'}`
                      : 'reply'}{' '}
                    · {p.when}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

function SignUpBlock() {
  return (
    <Card>
      <div className="px-4 py-4">
        <p className="text-sm font-semibold text-foreground mb-1.5">Join the conversation</p>
        <p className="text-xs text-foreground-light leading-relaxed mb-3">
          Post questions, answer threads, and pick up where you left off.
        </p>
        <div className="flex gap-2">
          <Button asChild type="primary" size="tiny" className="flex-1">
            <Link href="/signup">Sign up</Link>
          </Button>
          <Button asChild type="default" size="tiny" className="flex-1">
            <Link href="/login">Log in</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}

function TagButton({
  tag,
  count,
  active,
  onClick,
}: {
  tag: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded text-[11px] font-medium border px-1.5 py-0.5 transition-colors ${
        active
          ? 'text-foreground bg-surface-200 border-border-strong'
          : 'text-foreground-light bg-surface-100 border-border-default hover:border-border-strong hover:text-foreground'
      }`}
    >
      #{tag}
      <span className="text-foreground-lighter">{count}</span>
    </button>
  );
}
