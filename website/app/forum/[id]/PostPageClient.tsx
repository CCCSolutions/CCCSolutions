'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, ArrowUpIcon, ArrowDownIcon } from '@radix-ui/react-icons';
import { toast } from 'sonner';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { SectionContainer } from '../../../components/ui/section-container';
import { supabase, apiFetch } from '../../../lib/supabase';
import type { Session } from '@supabase/supabase-js';
import dynamic from 'next/dynamic';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.bubble.css';

type PostDetail = {
  id: string;
  title: string;
  content: string;
  score: number;
  createdAt: string;
  author: { username: string | null };
};

type CommentRow = {
  id: string;
  content: string;
  score: number;
  createdAt: string;
  author: { username: string | null };
};

type Props = {
  id: string;
};

export default function PostPageClient({ id }: Props) {
  const [post, setPost] = useState<PostDetail | null>(null);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [newComment, setNewComment] = useState('');
  const [session, setSession] = useState<Session | null>(null);
  const [postVote, setPostVote] = useState<1 | -1 | 0>(0);
  const [commentVotes, setCommentVotes] = useState<Record<string, 1 | -1 | 0>>({});
  const [submitting, setSubmitting] = useState(false);
  // The guard has to be a ref, not the state above: setSubmitting doesn't apply
  // until the next render, so back-to-back clicks in one frame would all read
  // submitting === false and each fire a create(). A ref writes synchronously.
  const submittingRef = useRef(false);

  const isLoggedIn = !!session;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  const fetchPost = useCallback(async () => {
    try {
      const res = await apiFetch(`/forum/posts/${id}`);
      if (!res.ok) return;
      const { post: p, comments: c } = (await res.json()) as {
        post: PostDetail;
        comments: CommentRow[];
      };
      setPost(p);
      setComments(c);
    } catch (error) {
      console.error('Error fetching post:', error);
    }
  }, [id]);

  useEffect(() => {
    fetchPost();
  }, [id, fetchPost]);

  const handlePostVote = async (value: 1 | -1) => {
    if (!isLoggedIn) {
      toast.warning('Please log in to vote.');
      return;
    }
    if (!post) return;

    const cancelling = postVote === value;
    const delta = cancelling ? -value : value - postVote;
    const prevVote = postVote;

    setPost((p) => (p ? { ...p, score: p.score + delta } : null));
    setPostVote(cancelling ? 0 : value);

    try {
      const res = cancelling
        ? await apiFetch('/forum/vote', {
            method: 'DELETE',
            body: JSON.stringify({ votableType: 'post', votableId: id }),
          })
        : await apiFetch('/forum/vote', {
            method: 'POST',
            body: JSON.stringify({ votableType: 'post', votableId: id, value }),
          });
      if (!res.ok) throw new Error(`Vote failed (${res.status})`);
    } catch (error) {
      console.error('Error voting on post:', error);
      toast.error('Could not register your vote.');
      setPost((p) => (p ? { ...p, score: p.score - delta } : null));
      setPostVote(prevVote);
    }
  };

  const handleCommentVote = async (commentId: string, value: 1 | -1) => {
    if (!isLoggedIn) {
      toast.warning('Please log in to vote.');
      return;
    }

    const current = commentVotes[commentId] ?? 0;
    const cancelling = current === value;
    const delta = cancelling ? -value : value - current;

    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, score: c.score + delta } : c)),
    );
    setCommentVotes((prev) => ({ ...prev, [commentId]: cancelling ? 0 : value }));

    try {
      const res = cancelling
        ? await apiFetch('/forum/vote', {
            method: 'DELETE',
            body: JSON.stringify({ votableType: 'comment', votableId: commentId }),
          })
        : await apiFetch('/forum/vote', {
            method: 'POST',
            body: JSON.stringify({ votableType: 'comment', votableId: commentId, value }),
          });
      if (!res.ok) throw new Error(`Vote failed (${res.status})`);
    } catch (error) {
      console.error('Error voting on comment:', error);
      toast.error('Could not register your vote.');
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, score: c.score - delta } : c)),
      );
      setCommentVotes((prev) => ({ ...prev, [commentId]: current }));
    }
  };

  const handleAddComment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.warning('Please log in to comment.');
      return;
    }
    if (submittingRef.current) return;

    submittingRef.current = true;
    setSubmitting(true);

    let created = false;
    try {
      const res = await apiFetch(`/forum/posts/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: newComment }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Failed to post comment (${res.status})`);
      }
      created = true;
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Could not post your comment.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }

    if (created) {
      setNewComment('');
      toast.success('Comment posted.');
      fetchPost(); // handles its own errors; must not affect the toast above
    }
  };

  if (!post) {
    return (
      <div className="bg-background text-foreground">
        <SectionContainer size="large" className="py-16">
          <p className="text-foreground-light">Loading…</p>
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
              <span className="text-sm text-foreground-lighter">
                By{' '}
                <span className="font-semibold text-foreground-light">
                  {post.author?.username ?? 'Unknown'}
                </span>{' '}
                on {new Date(post.createdAt).toISOString().split('T')[0]}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePostVote(1)}
                  disabled={!isLoggedIn}
                  aria-label="Upvote"
                  className={`transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    postVote === 1
                      ? 'text-brand font-bold'
                      : 'text-foreground-lighter hover:text-brand'
                  }`}
                >
                  <ArrowUpIcon width="16" height="16" />
                </button>
                <span className="font-semibold text-foreground">{post.score}</span>
                <button
                  onClick={() => handlePostVote(-1)}
                  disabled={!isLoggedIn}
                  aria-label="Downvote"
                  className={`transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    postVote === -1
                      ? 'text-destructive font-bold'
                      : 'text-foreground-lighter hover:text-destructive'
                  }`}
                >
                  <ArrowDownIcon width="16" height="16" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        <h2 className="text-xl font-semibold text-foreground mb-4">
          {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
        </h2>

        <div className="flex flex-col gap-3 mb-8">
          {comments.length === 0 ? (
            <p className="text-sm text-foreground-lighter italic">No comments yet.</p>
          ) : (
            comments.map((comment) => {
              const userVote = commentVotes[comment.id] ?? 0;
              return (
                <Card key={comment.id}>
                  <CardContent className="p-5 border-none">
                    <p className="text-foreground-light whitespace-pre-wrap">{comment.content}</p>
                    <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
                      <p className="text-xs text-foreground-lighter">
                        By{' '}
                        <span className="font-medium text-foreground-light">
                          {comment.author?.username ?? 'Unknown'}
                        </span>{' '}
                        on {new Date(comment.createdAt).toISOString().split('T')[0]}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCommentVote(comment.id, 1)}
                          disabled={!isLoggedIn}
                          aria-label="Upvote comment"
                          className={`transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            userVote === 1
                              ? 'text-brand font-bold'
                              : 'text-foreground-lighter hover:text-brand'
                          }`}
                        >
                          <ArrowUpIcon width="12" height="12" />
                        </button>
                        <span className="text-xs font-semibold text-foreground">
                          {comment.score}
                        </span>
                        <button
                          onClick={() => handleCommentVote(comment.id, -1)}
                          disabled={!isLoggedIn}
                          aria-label="Downvote comment"
                          className={`transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            userVote === -1
                              ? 'text-destructive font-bold'
                              : 'text-foreground-lighter hover:text-destructive'
                          }`}
                        >
                          <ArrowDownIcon width="12" height="12" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        <form onSubmit={handleAddComment} className="space-y-3">
          <label htmlFor="newComment" className="block text-sm font-medium text-foreground-light">
            Add a comment
          </label>
          <textarea
            id="newComment"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={isLoggedIn ? 'Share your thoughts…' : 'Log in to comment.'}
            disabled={!isLoggedIn || submitting}
            rows={4}
            className="w-full p-3 rounded-md border border-border-strong bg-surface-100 text-sm text-foreground placeholder:text-foreground-lighter focus:outline-none focus:border-brand-highlight disabled:opacity-50 disabled:cursor-not-allowed"
            required
          />
          <Button
            type="primary"
            size="medium"
            htmlType="submit"
            disabled={!isLoggedIn || submitting}
          >
            {submitting ? 'Posting…' : 'Add comment'}
          </Button>
        </form>
      </SectionContainer>
    </div>
  );
}
