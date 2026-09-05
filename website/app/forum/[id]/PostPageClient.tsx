'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  Pencil1Icon,
  TrashIcon,
} from '@radix-ui/react-icons';
import { toast } from 'sonner';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { SectionContainer } from '../../../components/ui/section-container';
import { apiFetch } from '../../../lib/supabase';
import { getMyVotes } from '../../../lib/votes';
import { useAuth } from '../../../components/auth/SupabaseAuthProvider';
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
  const [notFound, setNotFound] = useState(false);
  const [postVote, setPostVote] = useState<1 | -1 | 0>(0);
  const [commentVotes, setCommentVotes] = useState<Record<string, 1 | -1 | 0>>({});
  const [submitting, setSubmitting] = useState(false);
  // The guard has to be a ref, not the state above: setSubmitting doesn't apply
  // until the next render, so back-to-back clicks in one frame would all read
  // submitting === false and each fire a create(). A ref writes synchronously.
  const submittingRef = useRef(false);

  // Inline edit state. A post/comment shows an edit form in place of its body while its
  // id (or the post flag) is active.
  const [editingPost, setEditingPost] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [savingPost, setSavingPost] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  const [savingComment, setSavingComment] = useState(false);

  const { state, profile } = useAuth();
  const isLoggedIn = state === 'in';
  const router = useRouter();

  // Owner check for showing edit/delete controls. This is UI gating only; the backend
  // enforces authorship on every PATCH/DELETE.
  const ownsPost = isLoggedIn && !!post && post.author?.username === profile?.username;

  const fetchPost = useCallback(async () => {
    try {
      const res = await apiFetch(`/forum/posts/${id}`);
      if (!res.ok) {
        setNotFound(true);
        return;
      }
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

  // Seed this user's own vote on the post + its comments from the server (per-user data,
  // can't ride the cached post response). Keyed on the post id + comment-id string so it
  // seeds on load, not on every optimistic score mutation. Cleared when logged out.
  const commentIdsKey = comments.map((comment) => comment.id).join(',');
  useEffect(() => {
    if (!isLoggedIn || !post) {
      setPostVote(0);
      setCommentVotes({});
      return;
    }
    const postId = post.id;
    const controller = new AbortController();
    void Promise.all([
      getMyVotes('post', [postId], controller.signal),
      getMyVotes('comment', commentIdsKey.split(',').filter(Boolean), controller.signal),
    ]).then(([postVotes, commentVoteMap]) => {
      if (controller.signal.aborted) return;
      setPostVote(postVotes[postId] ?? 0);
      setCommentVotes(commentVoteMap);
    });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post?.id, commentIdsKey, isLoggedIn]);

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
      prev.map((c) => (c.id === commentId ? { ...c, score: c.score + delta } : c))
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
        prev.map((c) => (c.id === commentId ? { ...c, score: c.score - delta } : c))
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

  // Edit/delete talk to backend endpoints that are not implemented yet. Expected contracts:
  //   PATCH  /forum/posts/:id      body { title, content }   -> 200 updated post (author only)
  //   DELETE /forum/posts/:id                                 -> 200 { ok: true }  (author only)
  //   PATCH  /forum/comments/:id   body { content }          -> 200 updated comment (author only)
  //   DELETE /forum/comments/:id                              -> 200 { ok: true }  (author only)
  // Non-owners get 403; a missing row gets 404. Until they exist these calls 404 and the
  // handlers surface the error toast.

  const startEditPost = () => {
    if (!post) return;
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditingPost(true);
  };

  const handleUpdatePost = async () => {
    if (!post || savingPost) return;
    setSavingPost(true);
    try {
      const res = await apiFetch(`/forum/posts/${post.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: editTitle, content: editContent }),
      });
      if (!res.ok) throw new Error(`Failed to save post (${res.status})`);
      setPost((p) => (p ? { ...p, title: editTitle, content: editContent } : p));
      setEditingPost(false);
      toast.success('Post updated.');
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error('Could not save your changes.');
    } finally {
      setSavingPost(false);
    }
  };

  const handleDeletePost = async () => {
    if (!post) return;
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    try {
      const res = await apiFetch(`/forum/posts/${post.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Failed to delete post (${res.status})`);
      toast.success('Post deleted.');
      router.push('/forum');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Could not delete this post.');
    }
  };

  const startEditComment = (comment: CommentRow) => {
    setEditingCommentId(comment.id);
    setEditCommentContent(comment.content);
  };

  const handleUpdateComment = async (commentId: string) => {
    if (savingComment) return;
    setSavingComment(true);
    try {
      const res = await apiFetch(`/forum/comments/${commentId}`, {
        method: 'PATCH',
        body: JSON.stringify({ content: editCommentContent }),
      });
      if (!res.ok) throw new Error(`Failed to save comment (${res.status})`);
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, content: editCommentContent } : c))
      );
      setEditingCommentId(null);
      toast.success('Comment updated.');
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error('Could not save your changes.');
    } finally {
      setSavingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Delete this comment? This cannot be undone.')) return;
    try {
      const res = await apiFetch(`/forum/comments/${commentId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Failed to delete comment (${res.status})`);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast.success('Comment deleted.');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Could not delete this comment.');
    }
  };

  if (notFound) {
    return (
      <div className="bg-background text-foreground">
        <SectionContainer size="large" className="py-16">
          <Link
            href="/forum"
            className="inline-flex items-center gap-1.5 text-sm text-foreground-light hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeftIcon width="14" height="14" />
            Back to forum
          </Link>
          <p className="text-foreground-light">Post not found.</p>
        </SectionContainer>
      </div>
    );
  }

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
            {editingPost ? (
              <div className="mb-4 space-y-3">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full p-3 rounded-md border border-border-strong bg-surface-100 text-lg font-semibold text-foreground focus:outline-none focus:border-brand-highlight"
                  aria-label="Post title"
                />
                <ReactQuill
                  value={editContent}
                  onChange={setEditContent}
                  theme="bubble"
                  className="rounded-md border border-border-strong text-foreground-light leading-relaxed"
                />
                <div className="flex items-center gap-2">
                  <Button
                    type="primary"
                    size="tiny"
                    onClick={handleUpdatePost}
                    disabled={savingPost || editTitle.trim() === ''}
                  >
                    {savingPost ? 'Saving…' : 'Save'}
                  </Button>
                  <Button type="default" size="tiny" onClick={() => setEditingPost(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-4">
                  {post.title}
                </h1>

                <ReactQuill
                  value={post.content}
                  readOnly
                  theme="bubble"
                  className="text-foreground-light leading-relaxed mb-4"
                />
              </>
            )}

            <div className="flex items-center justify-between flex-wrap gap-3 pt-4 border-t border-border-default">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm text-foreground-lighter">
                  By{' '}
                  <span className="font-semibold text-foreground-light">
                    {post.author?.username ?? 'Unknown'}
                  </span>{' '}
                  on {new Date(post.createdAt).toISOString().split('T')[0]}
                </span>
                {ownsPost && !editingPost && (
                  <span className="flex items-center gap-1">
                    <button
                      onClick={startEditPost}
                      className="inline-flex items-center gap-1 text-xs text-foreground-lighter hover:text-foreground transition-colors"
                    >
                      <Pencil1Icon width="12" height="12" />
                      Edit
                    </button>
                    <button
                      onClick={handleDeletePost}
                      className="inline-flex items-center gap-1 text-xs text-foreground-lighter hover:text-destructive transition-colors"
                    >
                      <TrashIcon width="12" height="12" />
                      Delete
                    </button>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePostVote(1)}
                  disabled={!isLoggedIn}
                  aria-label="Upvote"
                  className={`transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    postVote === 1
                      ? 'text-orange-500 font-bold'
                      : 'text-foreground-lighter hover:text-orange-500'
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
                      ? 'text-brand font-bold'
                      : 'text-foreground-lighter hover:text-brand'
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
              const ownsComment = isLoggedIn && comment.author?.username === profile?.username;
              const isEditingThis = editingCommentId === comment.id;
              return (
                <Card key={comment.id}>
                  <CardContent className="p-5 border-none">
                    {isEditingThis ? (
                      <div className="space-y-2">
                        <textarea
                          value={editCommentContent}
                          onChange={(e) => setEditCommentContent(e.target.value)}
                          rows={3}
                          className="w-full p-2 rounded-md border border-border-strong bg-surface-100 text-sm text-foreground focus:outline-none focus:border-brand-highlight"
                          aria-label="Edit comment"
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            type="primary"
                            size="tiny"
                            onClick={() => handleUpdateComment(comment.id)}
                            disabled={savingComment || editCommentContent.trim() === ''}
                          >
                            {savingComment ? 'Saving…' : 'Save'}
                          </Button>
                          <Button
                            type="default"
                            size="tiny"
                            onClick={() => setEditingCommentId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-foreground-light whitespace-pre-wrap">{comment.content}</p>
                    )}
                    <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
                      <p className="text-xs text-foreground-lighter">
                        By{' '}
                        <span className="font-medium text-foreground-light">
                          {comment.author?.username ?? 'Unknown'}
                        </span>{' '}
                        on {new Date(comment.createdAt).toISOString().split('T')[0]}
                        {ownsComment && !isEditingThis && (
                          <>
                            {' · '}
                            <button
                              onClick={() => startEditComment(comment)}
                              className="text-foreground-lighter hover:text-foreground transition-colors"
                            >
                              Edit
                            </button>
                            {' · '}
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-foreground-lighter hover:text-destructive transition-colors"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCommentVote(comment.id, 1)}
                          disabled={!isLoggedIn}
                          aria-label="Upvote comment"
                          className={`transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            userVote === 1
                              ? 'text-orange-500 font-bold'
                              : 'text-foreground-lighter hover:text-orange-500'
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
                              ? 'text-brand font-bold'
                              : 'text-foreground-lighter hover:text-brand'
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
