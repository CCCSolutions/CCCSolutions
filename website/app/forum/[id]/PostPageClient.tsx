'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import PocketBase, { RecordModel } from 'pocketbase';
import { ArrowLeftIcon, ArrowUpIcon, ArrowDownIcon } from '@radix-ui/react-icons';
import { toast } from 'sonner';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { SectionContainer } from '../../../components/ui/section-container';
import dynamic from 'next/dynamic';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.bubble.css';

const pb = new PocketBase('https://mmhs.pockethost.io');

type Props = {
  id: string;
  initialPost: RecordModel | null;
};

export default function PostPageClient({ id, initialPost }: Props) {
  const [post, setPost] = useState<RecordModel | null>(initialPost);
  const [comments, setComments] = useState<RecordModel[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchPost = useCallback(async () => {
    try {
      const record = await pb.collection('posts').getOne(id, {
        expand: 'author',
        requestKey: `post_${id}`,
      });
      setPost(record);
    } catch (error) {
      const err = error as { isAbort?: boolean };
      if (!err.isAbort) console.error('Error fetching post:', error);
    }
  }, [id]);

  const fetchComments = useCallback(async () => {
    try {
      const resultList = await pb.collection('comments').getList(1, 50, {
        filter: `post="${id}"`,
        sort: '-created',
        expand: 'author',
        requestKey: `comments_${id}`,
      });
      setComments(resultList.items);
    } catch (error) {
      const err = error as { isAbort?: boolean };
      if (!err.isAbort) console.error('Error fetching comments:', error);
    }
  }, [id]);

  useEffect(() => {
    setIsLoggedIn(pb.authStore.isValid);
    fetchPost();
    fetchComments();
  }, [id, fetchPost, fetchComments]);

  // NOTE: remove the old `document.title` effect — the server now
  // sets the real <title> via generateMetadata, and manually
  // overwriting it client-side would fight with that.

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (!isLoggedIn) {
      toast.warning('Please log in to vote.');
      return;
    }
    if (!post) return;

    try {
      const updatedVotes = post.upvotes + (voteType === 'upvote' ? 1 : -1);
      await pb.collection('posts').update(id, { upvotes: updatedVotes });
      setPost((prev) => (prev ? { ...prev, upvotes: updatedVotes } : null));
    } catch (error) {
      console.error('Error voting on post:', error);
      toast.error('Could not register your vote.');
    }
  };

  const handleAddComment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.warning('Please log in to comment.');
      return;
    }
    // Without this guard, a fast double-click fires a second create() before the
    // first resolves and the same comment posts twice.
    if (submitting) return;

    if (!pb.authStore.model) {
      toast.warning('Session expired. Please log in again.');
      return;
    }

    setSubmitting(true);
    try {
      await pb.collection('comments').create({
        body: newComment,
        post: id,
        author: pb.authStore.model.id,
      });
      setNewComment('');
      await fetchComments();
      toast.success('Comment posted.');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Could not post your comment.');
    } finally {
      setSubmitting(false);
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
              value={post.body}
              readOnly
              theme="bubble"
              className="text-foreground-light leading-relaxed mb-4"
            />

            <div className="flex items-center justify-between flex-wrap gap-3 pt-4 border-t border-border-default">
              <span className="text-sm text-foreground-lighter">
                By{' '}
                <span className="font-semibold text-foreground-light">
                  {post.expand?.author?.username || 'Unknown'}
                </span>{' '}
                on {new Date(post.created).toLocaleDateString()}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleVote('upvote')}
                  disabled={!isLoggedIn}
                  aria-label="Upvote"
                  className="text-foreground-lighter hover:text-brand disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowUpIcon width="16" height="16" />
                </button>
                <span className="font-semibold text-foreground">{post.upvotes}</span>
                <button
                  onClick={() => handleVote('downvote')}
                  disabled={!isLoggedIn}
                  aria-label="Downvote"
                  className="text-foreground-lighter hover:text-destructive disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
            comments.map((comment) => (
              <Card key={comment.id}>
                <CardContent className="p-5 border-none">
                  <p className="text-foreground-light whitespace-pre-wrap">{comment.body}</p>
                  <p className="mt-3 text-xs text-foreground-lighter">
                    By{' '}
                    <span className="font-medium text-foreground-light">
                      {comment.expand?.author?.username || 'Unknown'}
                    </span>{' '}
                    on {new Date(comment.created).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))
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
