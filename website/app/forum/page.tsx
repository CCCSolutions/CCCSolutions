'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpIcon, ArrowDownIcon } from '@radix-ui/react-icons';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { SectionContainer } from '../../components/ui/section-container';
import { FlickeringGrid } from '../../components/effects/FlickeringGrid';
import { apiFetch } from '../../lib/supabase';
import { useAuth } from '../../components/auth/SupabaseAuthProvider';
import dynamic from 'next/dynamic';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.bubble.css';

type PostRow = {
  id: string;
  title: string;
  content: string;
  score: number;
  createdAt: string;
  author: { username: string | null };
};

// Tracks the current user's vote on each post so the arrows reflect their state.
type VoteMap = Record<string, 1 | -1 | 0>;

export default function ForumPage() {
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'new' | 'top'>('new');
  const [voteMap, setVoteMap] = useState<VoteMap>({});

  const { state, profile, logout } = useAuth();
  const session = state === 'in';
  const { push } = useRouter();

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/forum/posts?sort=${sortBy}`);
      if (!res.ok) throw new Error(`Failed to load posts (${res.status})`);
      const data = (await res.json()) as PostRow[];
      setPosts(data);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Could not load posts.');
    } finally {
      setLoading(false);
    }
  }, [sortBy]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleVote = async (postId: string, value: 1 | -1) => {
    if (!session) {
      toast.warning('Please log in to vote.');
      return;
    }

    const current = voteMap[postId] ?? 0;
    const cancelling = current === value;
    const delta = cancelling ? -value : value - current;

    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, score: p.score + delta } : p)));
    setVoteMap((prev) => ({ ...prev, [postId]: cancelling ? 0 : value }));

    try {
      const res = cancelling
        ? await apiFetch('/forum/vote', {
            method: 'DELETE',
            body: JSON.stringify({ votableType: 'post', votableId: postId }),
          })
        : await apiFetch('/forum/vote', {
            method: 'POST',
            body: JSON.stringify({ votableType: 'post', votableId: postId, value }),
          });
      if (!res.ok) throw new Error(`Vote failed (${res.status})`);
    } catch (error) {
      console.error('Error voting on post:', error);
      toast.error('Could not register your vote.');
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, score: p.score - delta } : p)));
      setVoteMap((prev) => ({ ...prev, [postId]: current }));
    }
  };

  return (
    <div className="bg-background text-foreground">
      {/* Header — same colors as the primary Button in dark mode: brand-500 fill,
          brand-highlight for the flickering grid (its border color). */}
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

      {/* Login status — moved below the hero, right-aligned */}
      <SectionContainer size="large" className="pt-4">
        <div className="flex justify-end text-sm text-foreground-light">
          {session ? (
            <span>
              Logged in as{' '}
              <span className="font-semibold text-foreground">
                {profile?.username ?? '…'}
              </span>
              {' · '}
              <button
                className="cursor-pointer underline hover:text-foreground"
                onClick={() => logout()}
              >
                Logout
              </button>
            </span>
          ) : (
            <span className="italic">
              Not logged in
              {' · '}
              <button
                className="cursor-pointer underline not-italic hover:text-foreground"
                onClick={() => push('/login')}
              >
                Login
              </button>
            </span>
          )}
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
                    <div className="flex flex-col items-center justify-start gap-1 pt-1 shrink-0 w-10">
                      <button
                        onClick={() => handleVote(post.id, 1)}
                        disabled={!session}
                        aria-label="Upvote"
                        className={`transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          userVote === 1
                            ? 'text-brand font-bold'
                            : 'text-foreground-lighter hover:text-brand'
                        }`}
                      >
                        <ArrowUpIcon width="16" height="16" />
                      </button>
                      <span className="text-sm font-semibold text-foreground">{post.score}</span>
                      <button
                        onClick={() => handleVote(post.id, -1)}
                        disabled={!session}
                        aria-label="Downvote"
                        className={`transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          userVote === -1
                            ? 'text-destructive font-bold'
                            : 'text-foreground-lighter hover:text-destructive'
                        }`}
                      >
                        <ArrowDownIcon width="16" height="16" />
                      </button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-semibold text-foreground hover:text-brand transition-colors mb-1">
                        <Link href={`/forum/${post.id}`}>{post.title}</Link>
                      </h2>
                      <ReactQuill
                        value={
                          post.content.length > 200
                            ? post.content.substring(0, 200) + '...'
                            : post.content
                        }
                        readOnly
                        theme="bubble"
                        className="text-foreground-light max-h-24 overflow-hidden"
                      />
                      <div className="mt-2 text-xs text-foreground-lighter">
                        By {post.author?.username ?? 'Unknown'} ·{' '}
                        {new Date(post.createdAt).toLocaleDateString()}
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
