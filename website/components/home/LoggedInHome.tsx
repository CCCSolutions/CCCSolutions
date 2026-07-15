'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Bookmark, ChevronRight, Plus, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { SectionContainer } from '../ui/section-container';
import { useAuth } from '../auth/AuthProvider';

// ─── Mock data ─────────────────────────────────────────────────────────────

const unreadReplies: number = 3;

type Difficulty = 'Easy' | 'Normal' | 'Hard' | 'Insane' | 'Wicked';

const potd = {
  code: '2023 S3',
  title: 'Repetitionention',
  difficulty: 'Hard' as Difficulty,
  tags: ['strings', 'simulation', 'greedy'],
  summary:
    'Given a string, repeatedly find the shortest adjacent equal pair and remove it. Output the resulting string. The trick is realizing a single linear pass with a stack handles every test case in O(N).',
  editorialHref: '/contest/2023/S3',
  dmojHref: 'https://dmoj.ca/problem/ccc23s3',
  discussHref: '/forum/preview/thread',
};

type RecentVisit = {
  code: string;
  title: string;
  difficulty: Difficulty;
  href: string;
  when: string;
};

const recentlyVisited: RecentVisit[] = [
  {
    code: '2024 S4',
    title: 'Painted Polygon',
    difficulty: 'Insane',
    href: '/contest/2024/S4',
    when: '2h ago',
  },
  {
    code: '2021 S2',
    title: 'Modern Art',
    difficulty: 'Hard',
    href: '/contest/2021/S2',
    when: '1d ago',
  },
  {
    code: '1998 S5',
    title: 'Maze',
    difficulty: 'Normal',
    href: '/contest/1998/S5',
    when: '3d ago',
  },
  {
    code: '2024 J5',
    title: 'Harvest Waterloo',
    difficulty: 'Hard',
    href: '/contest/2024/J5',
    when: '5d ago',
  },
  {
    code: '2020 S1',
    title: 'Surmising a Sprinter',
    difficulty: 'Easy',
    href: '/contest/2020/S1',
    when: '1w ago',
  },
];

type SavedProblem = { code: string; title: string; href: string };

const savedProblems: SavedProblem[] = [
  { code: '2019 S5', title: 'Triangle: The Data Structure', href: '/contest/2019/S5' },
  { code: '2017 S4', title: 'Minimum Cost Flow', href: '/contest/2017/S4' },
];

const pickerTags = [
  'dp',
  'graphs',
  'greedy',
  'strings',
  'segment-tree',
  'binary-search',
  'number-theory',
  'geometry',
  'trees',
  'simulation',
  'bitmask',
  'flows',
  'ad-hoc',
  'math',
  'parity',
];

type ForYouItem = {
  kind: 'problem' | 'thread' | 'editorial';
  title: string;
  meta: string;
  tags: string[];
  href: string;
};

const forYouFeed: ForYouItem[] = [
  {
    kind: 'problem',
    title: '2019 S5 — Triangle: The Data Structure',
    meta: 'Insane · Senior',
    tags: ['dp', 'segment-tree'],
    href: '/contest/2019/S5',
  },
  {
    kind: 'thread',
    title: '2024 S4 — is the official editorial wrong about the complexity?',
    meta: '4 answers · 12 min ago',
    tags: ['segment-tree', 'complexity'],
    href: '/forum/preview/thread',
  },
  {
    kind: 'editorial',
    title: 'New editorial: 2018 S3 — Lunch Concert',
    meta: 'Approach + Python solution added',
    tags: ['dp', 'binary-search'],
    href: '/contest/2018/S3',
  },
  {
    kind: 'problem',
    title: '2022 S4 — Good Game',
    meta: 'Hard · Senior',
    tags: ['dp', 'game-theory'],
    href: '/contest/2022/S4',
  },
];

type ForumThread = {
  type: 'Question' | 'Discussion';
  title: string;
  votes: number;
  replies: number;
  when: string;
  href: string;
};

const latestForumThreads: ForumThread[] = [
  {
    type: 'Discussion',
    title: 'Monotonic stack pattern — when do you reach for it?',
    votes: 31,
    replies: 12,
    when: '1d',
    href: '/forum/preview/thread',
  },
  {
    type: 'Discussion',
    title: 'How are you preparing for Senior 2026?',
    votes: 24,
    replies: 9,
    when: '3h',
    href: '/forum/preview/thread',
  },
  {
    type: 'Discussion',
    title: '"Verified on DMOJ" badge for usernames in threads?',
    votes: 22,
    replies: 6,
    when: '4d',
    href: '/forum/preview/thread',
  },
];

type Activity = {
  kind: 'thread' | 'reply' | 'editorial' | 'solution';
  body: string;
  meta: string;
  when: string;
  href: string;
};

const recentActivity: Activity[] = [
  {
    kind: 'thread',
    body: '@aetherwind asked: 2024 S4 — is the editorial wrong about complexity?',
    meta: '#algorithms · #segment-tree',
    when: '6h ago',
    href: '/forum/preview/thread',
  },
  {
    kind: 'reply',
    body: '@kshrestha answered on 2024 S4 — is the editorial wrong about complexity?',
    meta: '12 upvotes',
    when: '4h ago',
    href: '/forum/preview/thread',
  },
  {
    kind: 'solution',
    body: 'Python solution added for 1998 S5 Maze',
    meta: 'BFS with deque, ~80 lines',
    when: '1d ago',
    href: '/contest/1998/S5',
  },
  {
    kind: 'editorial',
    body: 'Editorial revised for 2022 J5 Square Pool',
    meta: 'Approach section rewritten',
    when: '2d ago',
    href: '/contest/2022/J5',
  },
  {
    kind: 'thread',
    body: '@sneha.k posted: Search keeps returning the wrong year ordering',
    meta: '#site-feedback · #bug',
    when: '2d ago',
    href: '/forum/preview/thread',
  },
];

// ─── Difficulty tag (mirrors ProblemTable.tsx) ─────────────────────────────

const difficultyClass: Record<Difficulty, string> = {
  Easy: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  Normal: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  Hard: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  Insane: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  Wicked:
    'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 evil-purple-glow',
};

function DifficultyTag({ level }: { level: Difficulty }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-xs ${difficultyClass[level]}`}
    >
      {level}
    </span>
  );
}

function TopicTag({ tag }: { tag: string }) {
  return (
    <span className="text-[10px] font-medium text-foreground-light bg-surface-200 border border-border-default rounded px-1.5 py-0.5">
      #{tag}
    </span>
  );
}

function TypePill({ type }: { type: 'Question' | 'Discussion' }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide text-foreground-light bg-surface-200 border border-border-default shrink-0">
      {type}
    </span>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export function LoggedInHome() {
  const { user } = useAuth();
  const username = user?.username || 'aetherwind';

  // Mock subscription state. Real impl: DB-backed user_tag_subscriptions.
  const [subbedTags, setSubbedTags] = useState<Set<string>>(new Set());

  const toggleSub = (tag: string) => {
    setSubbedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  return (
    <div className="bg-background text-foreground">
      <SectionContainer size="large" className="py-10">
        {/* Hero */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
            Welcome back, <span className="text-foreground">@{username}</span>
          </h1>
          <p className="mt-2 text-sm text-foreground-light">
            {unreadReplies > 0 ? (
              <>
                <Link href="/inbox" className="text-foreground font-medium hover:underline">
                  {unreadReplies} new {unreadReplies === 1 ? 'reply' : 'replies'} on your threads
                </Link>
                {' · '}
              </>
            ) : null}
            Last visit 2 days ago · 47 contests in the archive
          </p>
        </div>

        <div className="grid lg:grid-cols-[240px_1fr] gap-8">
          {/* Sidebar: Continue + Saved */}
          <aside className="hidden lg:block">
            <div className="flex flex-col gap-5">
              <SidebarCard title="Continue">
                {recentlyVisited.length === 0 ? (
                  <p className="px-4 py-3 text-xs text-foreground-light">No recent activity yet.</p>
                ) : (
                  <ul className="flex flex-col max-h-[300px] overflow-y-auto divide-y divide-border-default">
                    {recentlyVisited.map((p) => (
                      <li key={p.code}>
                        <Link
                          href={p.href}
                          className="flex items-baseline justify-between gap-2 px-4 py-2.5 hover:bg-surface-200/50 transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="text-[11px] font-mono uppercase tracking-wider text-foreground-lighter">
                              {p.code}
                            </p>
                            <p className="text-xs font-medium text-foreground truncate">
                              {p.title}
                            </p>
                          </div>
                          <span className="text-[10px] text-foreground-lighter shrink-0">
                            {p.when}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </SidebarCard>

              <SidebarCard
                title="Saved"
                action={
                  <Link
                    href="/account/bookmarks"
                    className="text-[10px] text-foreground-lighter hover:text-foreground"
                  >
                    All →
                  </Link>
                }
              >
                {savedProblems.length === 0 ? (
                  <p className="px-4 py-3 text-xs text-foreground-light">Nothing saved yet.</p>
                ) : (
                  <ul className="flex flex-col divide-y divide-border-default">
                    {savedProblems.map((p) => (
                      <li key={p.code}>
                        <Link
                          href={p.href}
                          className="flex items-center gap-2 px-4 py-2.5 hover:bg-surface-200/50 transition-colors"
                        >
                          <Bookmark size={12} className="text-foreground-lighter shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[11px] font-mono uppercase tracking-wider text-foreground-lighter">
                              {p.code}
                            </p>
                            <p className="text-xs font-medium text-foreground truncate">
                              {p.title}
                            </p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </SidebarCard>
            </div>
          </aside>

          {/* Main */}
          <main className="min-w-0 flex flex-col gap-10">
            {/* Today's problem */}
            <section>
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  Today&apos;s problem
                </h2>
                <Link
                  href="/solutions"
                  className="text-xs text-foreground-light hover:text-foreground"
                >
                  Browse all →
                </Link>
              </div>
              <Card>
                <div className="px-5 py-5 flex flex-col gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono uppercase tracking-wider text-foreground-lighter">
                      {potd.code}
                    </span>
                    <DifficultyTag level={potd.difficulty} />
                    {potd.tags.map((t) => (
                      <TopicTag key={t} tag={t} />
                    ))}
                  </div>
                  <h3 className="text-xl font-semibold tracking-tight text-foreground">
                    {potd.title}
                  </h3>
                  <p className="text-sm text-foreground-light leading-relaxed">{potd.summary}</p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Button asChild type="primary" size="small">
                      <Link href={potd.editorialHref}>Read editorial</Link>
                    </Button>
                    <Button asChild type="default" size="small">
                      <a
                        href={potd.dmojHref}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5"
                      >
                        <ExternalLink size={14} />
                        Try on DMOJ
                      </a>
                    </Button>
                    <Button asChild type="default" size="small">
                      <Link href={potd.discussHref}>Discuss</Link>
                    </Button>
                  </div>
                </div>
              </Card>
            </section>

            {/* For you */}
            <section>
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="text-lg font-semibold tracking-tight text-foreground">For you</h2>
                {subbedTags.size > 0 && (
                  <button
                    type="button"
                    onClick={() => setSubbedTags(new Set())}
                    className="text-xs text-foreground-light hover:text-foreground"
                  >
                    Manage tags →
                  </button>
                )}
              </div>

              {subbedTags.size === 0 ? (
                <ForYouEmptyState
                  pickerTags={pickerTags}
                  subbed={subbedTags}
                  onToggle={toggleSub}
                />
              ) : (
                <ForYouFeed subbedTags={subbedTags} items={forYouFeed} />
              )}
            </section>

            {/* Active threads */}
            <section>
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  Active threads
                </h2>
                <Link href="/forum" className="text-xs text-foreground-light hover:text-foreground">
                  Browse forum →
                </Link>
              </div>
              <Card>
                <ul className="divide-y divide-border-default">
                  {latestForumThreads.map((t, i) => (
                    <li key={i}>
                      <Link
                        href={t.href}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-surface-200/50 transition-colors"
                      >
                        <TypePill type={t.type} />
                        <p className="text-sm font-medium text-foreground flex-1 min-w-0 truncate">
                          {t.title}
                        </p>
                        <span className="text-[11px] text-foreground-lighter shrink-0 whitespace-nowrap">
                          {t.votes} votes · {t.replies} replies · {t.when}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            </section>

            {/* Recent activity */}
            <section>
              <h2 className="text-lg font-semibold tracking-tight text-foreground mb-3">
                Recent activity
              </h2>
              <Card>
                <ul className="divide-y divide-border-default">
                  {recentActivity.map((item, i) => (
                    <li key={i}>
                      <Link
                        href={item.href}
                        className="flex items-center gap-4 px-5 py-3 hover:bg-surface-200/50 transition-colors"
                      >
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-foreground-lighter w-20 shrink-0">
                          {item.kind}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground-light truncate">{item.body}</p>
                          <p className="text-[11px] text-foreground-lighter mt-0.5 truncate">
                            {item.meta}
                          </p>
                        </div>
                        <span className="text-[11px] text-foreground-lighter whitespace-nowrap">
                          {item.when}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            </section>
          </main>
        </div>
      </SectionContainer>
    </div>
  );
}

// ─── For-you components ────────────────────────────────────────────────────

function ForYouEmptyState({
  pickerTags,
  subbed,
  onToggle,
}: {
  pickerTags: string[];
  subbed: Set<string>;
  onToggle: (tag: string) => void;
}) {
  return (
    <Card>
      <div className="px-5 py-6">
        <p className="text-sm font-semibold text-foreground mb-1">Pick topics you want to follow</p>
        <p className="text-xs text-foreground-light leading-relaxed mb-4">
          Subscribed tags drive what shows up here: new problems, forum threads, and editorials
          matching what you care about. No tracking — just the tags you opt into.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {pickerTags.map((tag) => {
            const active = subbed.has(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => onToggle(tag)}
                className={`inline-flex items-center gap-1 rounded text-xs font-medium border px-2 py-1 transition-colors ${
                  active
                    ? 'text-foreground bg-surface-200 border-border-strong'
                    : 'text-foreground-light bg-surface-100 border-border-default hover:border-border-strong hover:text-foreground'
                }`}
              >
                {active ? <Check size={11} /> : <Plus size={11} />}#{tag}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-foreground-lighter mt-4">
          Pick at least one to start. You can change this anytime.
        </p>
      </div>
    </Card>
  );
}

function ForYouFeed({ subbedTags, items }: { subbedTags: Set<string>; items: ForYouItem[] }) {
  const subbedList = Array.from(subbedTags);
  const filtered = items.filter((i) => i.tags.some((t) => subbedTags.has(t)));
  const visible = filtered.length > 0 ? filtered : items;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-foreground-light">
        Latest in{' '}
        {subbedList.map((t, i) => (
          <span key={t}>
            <span className="text-foreground font-medium">#{t}</span>
            {i < subbedList.length - 1 ? ', ' : ''}
          </span>
        ))}
      </p>
      <Card>
        <ul className="divide-y divide-border-default">
          {visible.map((item, i) => (
            <li key={i}>
              <Link
                href={item.href}
                className="flex items-center gap-4 px-5 py-3 hover:bg-surface-200/50 transition-colors"
              >
                <span className="text-[10px] uppercase tracking-wider font-semibold text-foreground-lighter w-20 shrink-0">
                  {item.kind}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                  <p className="text-[11px] text-foreground-lighter mt-0.5">{item.meta}</p>
                </div>
                <div className="hidden sm:flex gap-1.5 shrink-0">
                  {item.tags.slice(0, 2).map((t) => (
                    <TopicTag key={t} tag={t} />
                  ))}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function SidebarCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
        <p className="text-[11px] uppercase tracking-wider text-foreground-lighter">{title}</p>
        {action}
      </div>
      {children}
    </Card>
  );
}
