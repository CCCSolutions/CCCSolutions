'use client';

import React, { useState, useEffect } from 'react';
import PocketBase, { RecordModel, AuthModel } from 'pocketbase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpIcon, ArrowDownIcon } from '@radix-ui/react-icons';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { SectionContainer } from '../../components/ui/section-container';
import { FlickeringGrid } from '../../components/effects/FlickeringGrid';
import dynamic from 'next/dynamic';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.bubble.css';

const pb = new PocketBase('https://mmhs.pockethost.io');

export default function ForumPage() {
  const [posts, setPosts] = useState<RecordModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'new' | 'top'>('new');
  const [user, setUser] = useState<AuthModel | null>(null);

  const { push } = useRouter();

  useEffect(() => {
    setUser(pb.authStore.model);
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const sortField = sortBy === 'new' ? '-created' : '-upvotes';
        const resultList = await pb.collection('posts').getList(1, 50, {
          sort: sortField,
          expand: 'author',
          requestKey: `posts_${sortField}`,
        });
        setPosts(resultList.items);
      } catch (error: unknown) {
        const err = error as { isAbort?: boolean };
        if (!err.isAbort) {
          console.error('Error fetching posts:', error);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [sortBy]);

  const handleVote = async (postId: string, voteType: 'upvote' | 'downvote') => {
    if (!user) {
      alert('Please log in to vote.');
      return;
    }
    try {
      const post = posts.find((p) => p.id === postId);
      if (!post) return;
      const updatedVotes = voteType === 'upvote' ? post.upvotes + 1 : post.upvotes - 1;
      await pb.collection('posts').update(postId, { upvotes: updatedVotes });
      setPosts((prev) => {
        const next = prev.map((p) => (p.id === postId ? { ...p, upvotes: updatedVotes } : p));
        if (sortBy === 'top') {
          next.sort((a, b) => b.upvotes - a.upvotes);
        }
        return next;
      });
    } catch (error) {
      console.error('Error voting on post:', error);
    }
  };

  const handleLogout = () => {
    pb.authStore.clear();
    setUser(null);
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
          {user ? (
            <span>
              Logged in as <span className="font-semibold text-foreground">{user.username}</span>
              {' · '}
              <button
                className="cursor-pointer underline hover:text-foreground"
                onClick={handleLogout}
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
            {posts.map((post) => (
              <Card key={post.id} className="hover:bg-surface-200/40 transition-colors">
                <div className="flex gap-4 px-5 py-4">
                  <div className="flex flex-col items-center justify-start gap-1 pt-1 shrink-0 w-10">
                    <button
                      onClick={() => handleVote(post.id, 'upvote')}
                      disabled={!user}
                      aria-label="Upvote"
                      className="text-foreground-lighter hover:text-brand disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ArrowUpIcon width="16" height="16" />
                    </button>
                    <span className="text-sm font-semibold text-foreground">{post.upvotes}</span>
                    <button
                      onClick={() => handleVote(post.id, 'downvote')}
                      disabled={!user}
                      aria-label="Downvote"
                      className="text-foreground-lighter hover:text-destructive disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                        post.body.length > 200 ? post.body.substring(0, 200) + '...' : post.body
                      }
                      readOnly
                      theme="bubble"
                      className="text-foreground-light max-h-24 overflow-hidden"
                    />
                    <div className="mt-2 text-xs text-foreground-lighter">
                      By {post.expand?.author?.username || 'Unknown'} ·{' '}
                      {new Date(post.created).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </SectionContainer>
    </div>
  );
}
