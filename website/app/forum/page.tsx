'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpIcon, ArrowDownIcon } from '@radix-ui/react-icons';
import Image from 'next/image';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { SectionContainer } from '../../components/ui/section-container';
import { FlickeringGrid } from '../../components/effects/FlickeringGrid';
import { useAuth } from '../../components/auth/AuthProvider';
import { apiFetch } from '../../lib/supabase';
import dynamic from 'next/dynamic';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.bubble.css';

const DEFAULT_AVATAR = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><rect width='24' height='24' rx='12' fill='%23312e81'/><text x='50%25' y='54%25' dominant-baseline='middle' text-anchor='middle' font-size='10' fill='white' font-family='sans-serif'>?</text></svg>`;

type PostRow = {
  id: string;
  title: string;
  content: string;
  score: number;
  createdAt: string;
  authorUsername: string | null;
  authorAvatarUrl: string | null;
  authorRole?: string | null;
};

// Track the current user's votes so the UI reflects their state
type VoteMap = Record<string, 1 | -1 | 0>; // votableId -> value

export default function ForumPage() {
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'new' | 'top'>('new');
  const [voteMap, setVoteMap] = useState<VoteMap>({});

  const { profile, state } = useAuth();
  const { push } = useRouter();

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/forum/posts?sort=${sortBy}`);
      if (res.ok) {
        const data = await res.json() as PostRow[];
        setPosts(data);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  }, [sortBy]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleVote = async (postId: string, value: 1 | -1) => {
    if (state !== 'in') { push('/login'); return; }
    if (profile && /^user_\d+$/.test(profile.username)) { push('/onboarding'); return; }

    const current = voteMap[postId] ?? 0;

    // Clicking the same arrow again cancels the vote
    if (current === value) {
      // Optimistic
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, score: p.score - value } : p));
      setVoteMap((prev) => ({ ...prev, [postId]: 0 }));
      try {
        const res = await apiFetch('/forum/vote', {
          method: 'DELETE',
          body: JSON.stringify({ votableType: 'post', votableId: postId }),
        });
        if (!res.ok) {
          setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, score: p.score + value } : p));
          setVoteMap((prev) => ({ ...prev, [postId]: current }));
        }
      } catch {
        setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, score: p.score + value } : p));
        setVoteMap((prev) => ({ ...prev, [postId]: current }));
      }
      return;
    }

    // New vote or flipping direction — upsert
    const delta = value - current;
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, score: p.score + delta } : p));
    setVoteMap((prev) => ({ ...prev, [postId]: value }));
    try {
      const res = await apiFetch('/forum/vote', {
        method: 'POST',
        body: JSON.stringify({ votableType: 'post', votableId: postId, value }),
      });
      if (!res.ok) {
        setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, score: p.score - delta } : p));
        setVoteMap((prev) => ({ ...prev, [postId]: current }));
      }
    } catch {
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, score: p.score - delta } : p));
      setVoteMap((prev) => ({ ...prev, [postId]: current }));
    }
  };

  return (
    <div className="bg-background text-foreground">
      {/* Header */}
      <div
        data-theme="dark"
        className="relative overflow-hidden border-b border-border-default"
        style={{ backgroundColor: 'hsl(244, 66%, 34%)' }}
      >
        <div aria-hidden className="absolute inset-0 z-0 pointer-events-none">
          <FlickeringGrid
            className="size-full"
            squareSize={4}
            gridGap={6}
            color="hsl(235, 90%, 78%)"
            maxOpacity={0.15}
            flickerChance={0.03}
          />
        </div>
        <SectionContainer size="large" className="relative z-10 pt-16 pb-12">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white">Forum</h1>
          <p className="mt-4 text-base md:text-lg text-white/75 max-w-2xl">
            Ask, search, or answer any question related to the CCC.
          </p>
        </SectionContainer>
      </div>

      {/* Auth status row */}
      <SectionContainer size="large" className="pt-4">
        <div className="flex justify-end text-sm text-foreground-light">
          {state === 'in' && profile ? (
            <span>
              Logged in as{' '}
              <span className="font-semibold text-foreground">{profile.username}</span>
              {profile && /^user_\d+$/.test(profile.username) && (
                <span className="ml-2 text-warning text-xs">
                  ·{' '}
                  <Link href="/onboarding" className="underline hover:text-foreground">
                    Complete setup to post
                  </Link>
                </span>
              )}
            </span>
          ) : state === 'out' ? (
            <span className="italic">
              Not logged in{' · '}
              <button
                className="cursor-pointer underline not-italic hover:text-foreground"
                onClick={() => push('/login')}
              >
                Sign in
              </button>
            </span>
          ) : null}
        </div>
      </SectionContainer>

      {/* Sort + new post row */}
      <SectionContainer size="large" className="pt-5 pb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground-lighter">Sort by</span>
            <div className="flex gap-1.5">
              {(['new', 'top'] as const).map((option) => (
                <Button
                  key={option}
                  type={sortBy === option ? 'primary' : 'default'}
                  size="tiny"
                  onClick={() => setSortBy(option)}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          <Button asChild type="primary" size="small">
            <Link href="/create-post">+ New post</Link>
          </Button>
        </div>
      </SectionContainer>

      {/* Posts */}
      <SectionContainer size="large" className="pb-20">
        {loading ? (
          <div className="text-center text-foreground-light py-12">Loading posts…</div>
        ) : posts.length === 0 ? (
          <div className="text-center text-foreground-light py-12">
            No posts yet. Be the first to{' '}
            <Link href="/create-post" className="text-brand hover:underline">
              create one
            </Link>
            .
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {posts.map((post) => {
              const userVote = voteMap[post.id] ?? 0;
              return (
                <Card key={post.id} className="hover:bg-surface-200/40 transition-colors">
                  <div className="flex gap-4 px-5 py-4">
                    {/* Vote column */}
                    <div className="flex flex-col items-center justify-start gap-1 pt-1 shrink-0 w-10">
                      <button
                        id={`upvote-post-${post.id}`}
                        onClick={() => handleVote(post.id, 1)}
                        disabled={state !== 'in'}
                        aria-label="Upvote"
                        className={`transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          userVote === 1
                            ? 'text-green-600 dark:text-green-400 font-bold'
                            : 'text-foreground-lighter hover:text-green-600 dark:hover:text-green-400'
                        }`}
                      >
                        <ArrowUpIcon width="16" height="16" />
                      </button>
                      <span className="text-sm font-semibold text-foreground">{post.score}</span>
                      <button
                        id={`downvote-post-${post.id}`}
                        onClick={() => handleVote(post.id, -1)}
                        disabled={state !== 'in'}
                        aria-label="Downvote"
                        className={`transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          userVote === -1
                            ? 'text-red-600 dark:text-red-400 font-bold'
                            : 'text-foreground-lighter hover:text-red-600 dark:hover:text-red-400'
                        }`}
                      >
                        <ArrowDownIcon width="16" height="16" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-semibold text-foreground hover:text-brand transition-colors mb-1">
                        <Link href={`/forum/${post.id}`}>{post.title}</Link>
                      </h2>
                      <ReactQuill
                        value={post.content}
                        readOnly
                        theme="bubble"
                        className="text-foreground-light max-h-24 overflow-hidden"
                      />
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-foreground-lighter">
                        <Image
                          src={post.authorAvatarUrl ?? DEFAULT_AVATAR}
                          alt={post.authorUsername ?? 'Unknown'}
                          width={16}
                          height={16}
                          className="rounded-full"
                          unoptimized
                        />
                        <span>{post.authorUsername ?? 'Unknown'}</span>
                        {(post.authorRole === 'moderator' || post.authorRole === 'admin') && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-xs text-[10px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                            Admin
                          </span>
                        )}
                        <span>·</span>
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </SectionContainer>
    </div>
  );
}
