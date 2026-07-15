'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeftIcon, ArrowUpIcon, ArrowDownIcon } from '@radix-ui/react-icons';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { SectionContainer } from '../../../components/ui/section-container';
import { useAuth } from '../../../components/auth/AuthProvider';
import { apiFetch } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.bubble.css';

const DEFAULT_AVATAR = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><rect width='24' height='24' rx='12' fill='%23312e81'/><text x='50%25' y='54%25' dominant-baseline='middle' text-anchor='middle' font-size='10' fill='white' font-family='sans-serif'>?</text></svg>`;

type PostDetail = {
  id: string;
  title: string;
  content: string;
  score: number;
  createdAt: string;
  authorUsername: string | null;
  authorAvatarUrl: string | null;
  authorRole?: string | null;
};

type CommentRow = {
  id: string;
  content: string;
  score: number;
  createdAt: string;
  authorUsername: string | null;
  authorAvatarUrl: string | null;
  authorRole?: string | null;
};

type Props = {
  id: string;
};

export default function PostPageClient({ id }: Props) {
  const [post, setPost] = useState<PostDetail | null>(null);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [commentError, setCommentError] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  // Vote tracking
  const [postVote, setPostVote] = useState<1 | -1 | 0>(0);
  const [commentVotes, setCommentVotes] = useState<Record<string, 1 | -1 | 0>>({});

  const { profile, state } = useAuth();
  const router = useRouter();

  const isLoggedIn = state === 'in';
  const canWrite = isLoggedIn && profile && !/^user_\d+$/.test(profile.username);

  const fetchPost = useCallback(async () => {
    try {
      const res = await apiFetch(`/forum/posts/${id}`);
      if (!res.ok) return;
      const { post: p, comments: c } = await res.json() as {
        post: PostDetail;
        comments: CommentRow[];
      };
      setPost(p);
      setComments(c);
    } catch (err) {
      console.error('Error fetching post:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  // ---------------------------------------------------------------------------
  // Voting
  // ---------------------------------------------------------------------------

  const handlePostVote = async (value: 1 | -1) => {
    if (!isLoggedIn) { router.push('/login'); return; }
    if (!canWrite) { router.push('/onboarding'); return; }
    if (!post) return;

    // Clicking the active vote cancels it
    if (postVote === value) {
      setPost((p) => p ? { ...p, score: p.score - value } : null);
      setPostVote(0);
      const res = await apiFetch('/forum/vote', {
        method: 'DELETE',
        body: JSON.stringify({ votableType: 'post', votableId: id }),
      });
      if (!res.ok) {
        setPost((p) => p ? { ...p, score: p.score + value } : null);
        setPostVote(value);
      }
      return;
    }

    // New vote or flip direction — upsert
    const delta = value - postVote;
    setPost((p) => p ? { ...p, score: p.score + delta } : null);
    setPostVote(value);
    const res = await apiFetch('/forum/vote', {
      method: 'POST',
      body: JSON.stringify({ votableType: 'post', votableId: id, value }),
    });
    if (!res.ok) {
      setPost((p) => p ? { ...p, score: p.score - delta } : null);
      setPostVote(postVote);
    }
  };

  const handleCommentVote = async (commentId: string, value: 1 | -1) => {
    if (!isLoggedIn) { router.push('/login'); return; }
    if (!canWrite) { router.push('/onboarding'); return; }

    const current = commentVotes[commentId] ?? 0;

    // Clicking the active vote cancels it
    if (current === value) {
      setComments((prev) => prev.map((c) => c.id === commentId ? { ...c, score: c.score - value } : c));
      setCommentVotes((prev) => ({ ...prev, [commentId]: 0 }));
      const res = await apiFetch('/forum/vote', {
        method: 'DELETE',
        body: JSON.stringify({ votableType: 'comment', votableId: commentId }),
      });
      if (!res.ok) {
        setComments((prev) => prev.map((c) => c.id === commentId ? { ...c, score: c.score + value } : c));
        setCommentVotes((prev) => ({ ...prev, [commentId]: value }));
      }
      return;
    }

    // New vote or flip direction — upsert
    const delta = value - current;
    setComments((prev) => prev.map((c) => c.id === commentId ? { ...c, score: c.score + delta } : c));
    setCommentVotes((prev) => ({ ...prev, [commentId]: value }));
    const res = await apiFetch('/forum/vote', {
      method: 'POST',
      body: JSON.stringify({ votableType: 'comment', votableId: commentId, value }),
    });
    if (!res.ok) {
      setComments((prev) => prev.map((c) => c.id === commentId ? { ...c, score: c.score - delta } : c));
      setCommentVotes((prev) => ({ ...prev, [commentId]: current }));
    }
  };

  // ---------------------------------------------------------------------------
  // Add comment
  // ---------------------------------------------------------------------------

  const handleAddComment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isLoggedIn) { router.push('/login'); return; }
    if (!canWrite) { router.push('/onboarding'); return; }

    setCommentError('');
    setCommentLoading(true);

    const res = await apiFetch(`/forum/posts/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content: newComment }),
    });

    setCommentLoading(false);

    if (res.ok) {
      setNewComment('');
      await fetchPost(); // refresh comments
    } else {
      const body = await res.json().catch(() => ({})) as { error?: string };
      setCommentError(body.error ?? 'Failed to post comment. Please try again.');
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="bg-background text-foreground">
        <SectionContainer size="large" className="py-16">
          <p className="text-foreground-light">Loading…</p>
        </SectionContainer>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="bg-background text-foreground">
        <SectionContainer size="large" className="py-16">
          <p className="text-foreground-light">Post not found.</p>
        </SectionContainer>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground">
      <SectionContainer size="large" className="pt-12 pb-20">
        <Link
          href="/forum"
          className="inline-flex items-center gap-1.5 text-sm text-foreground-light hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeftIcon width="14" height="14" />
          Back to forum
        </Link>

        {/* Post card */}
        <Card className="mb-8">
          <CardContent className="py-8 px-6 border-none">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-4">
              {post.title}
            </h1>

            <ReactQuill
              value={post.content}
              readOnly
              theme="bubble"
              className="text-foreground-light leading-relaxed mb-4"
            />

            <div className="flex items-center justify-between flex-wrap gap-3 pt-4 border-t border-border-default">
              <div className="flex items-center gap-1.5 text-sm text-foreground-lighter">
                <Image
                  src={post.authorAvatarUrl ?? DEFAULT_AVATAR}
                  alt={post.authorUsername ?? 'Unknown'}
                  width={18}
                  height={18}
                  className="rounded-full"
                  unoptimized
                />
                <span className="flex items-center gap-1.5 flex-wrap">
                  <span>By</span>
                  <span className="font-semibold text-foreground-light">
                    {post.authorUsername ?? 'Unknown'}
                  </span>
                  {(post.authorRole === 'moderator' || post.authorRole === 'admin') && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-xs text-[10px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      Admin
                    </span>
                  )}
                  <span>on {new Date(post.createdAt).toLocaleDateString()}</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id={`upvote-post-btn`}
                  onClick={() => handlePostVote(1)}
                  disabled={!isLoggedIn}
                  aria-label="Upvote post"
                  className={`transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    postVote === 1
                      ? 'text-green-600 dark:text-green-400 font-bold'
                      : 'text-foreground-lighter hover:text-green-600 dark:hover:text-green-400'
                  }`}
                >
                  <ArrowUpIcon width="16" height="16" />
                </button>
                <span className="font-semibold text-foreground">{post.score}</span>
                <button
                  id={`downvote-post-btn`}
                  onClick={() => handlePostVote(-1)}
                  disabled={!isLoggedIn}
                  aria-label="Downvote post"
                  className={`transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    postVote === -1
                      ? 'text-red-600 dark:text-red-400 font-bold'
                      : 'text-foreground-lighter hover:text-red-600 dark:hover:text-red-400'
                  }`}
                >
                  <ArrowDownIcon width="16" height="16" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments */}
        <h2 className="text-xl font-semibold text-foreground mb-4">
          {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
        </h2>

        <div className="flex flex-col gap-3 mb-8">
          {comments.length === 0 ? (
            <p className="text-sm text-foreground-lighter italic">No comments yet.</p>
          ) : (
            comments.map((comment) => (
              <Card key={comment.id}>
                <CardContent className="p-5 border-none">
                  <p className="text-foreground-light whitespace-pre-wrap">{comment.content}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-foreground-lighter">
                      <Image
                        src={comment.authorAvatarUrl ?? DEFAULT_AVATAR}
                        alt={comment.authorUsername ?? 'Unknown'}
                        width={14}
                        height={14}
                        className="rounded-full"
                        unoptimized
                      />
                      <span className="flex items-center gap-1.5 flex-wrap">
                        <span>By</span>
                        <span className="font-medium text-foreground-light">
                          {comment.authorUsername ?? 'Unknown'}
                        </span>
                        {(comment.authorRole === 'moderator' || comment.authorRole === 'admin') && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-xs text-[10px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                            Admin
                          </span>
                        )}
                        <span>on {new Date(comment.createdAt).toLocaleDateString()}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        id={`upvote-comment-${comment.id}`}
                        onClick={() => handleCommentVote(comment.id, 1)}
                        disabled={!isLoggedIn}
                        aria-label="Upvote comment"
                        className={`transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          commentVotes[comment.id] === 1
                            ? 'text-green-600 dark:text-green-400 font-bold'
                            : 'text-foreground-lighter hover:text-green-600 dark:hover:text-green-400'
                        }`}
                      >
                        <ArrowUpIcon width="12" height="12" />
                      </button>
                      <span className="text-xs font-semibold text-foreground">{comment.score}</span>
                      <button
                        id={`downvote-comment-${comment.id}`}
                        onClick={() => handleCommentVote(comment.id, -1)}
                        disabled={!isLoggedIn}
                        aria-label="Downvote comment"
                        className={`transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          commentVotes[comment.id] === -1
                            ? 'text-red-600 dark:text-red-400 font-bold'
                            : 'text-foreground-lighter hover:text-red-600 dark:hover:text-red-400'
                        }`}
                      >
                        <ArrowDownIcon width="12" height="12" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Add comment */}
        <form onSubmit={handleAddComment} className="space-y-3">
          <label htmlFor="newComment" className="block text-sm font-medium text-foreground-light">
            Add a comment
          </label>
          <textarea
            id="newComment"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={
              !isLoggedIn
                ? 'Sign in to comment.'
                : !canWrite
                  ? 'Complete onboarding to comment.'
                  : 'Share your thoughts…'
            }
            disabled={!canWrite}
            rows={4}
            className="w-full p-3 rounded-md border border-border-strong bg-surface-100 text-sm text-foreground placeholder:text-foreground-lighter focus:outline-none focus:border-brand-highlight disabled:opacity-50 disabled:cursor-not-allowed"
            required
          />
          {commentError && (
            <p className="text-xs text-red-500 dark:text-red-400">{commentError}</p>
          )}
          <Button
            type="primary"
            size="medium"
            htmlType="submit"
            disabled={!canWrite || commentLoading}
          >
            {commentLoading ? 'Posting…' : 'Add comment'}
          </Button>
        </form>
      </SectionContainer>
    </div>
  );
}
