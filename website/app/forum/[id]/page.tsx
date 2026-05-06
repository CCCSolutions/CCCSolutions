'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PocketBase, { RecordModel } from 'pocketbase';
import { ArrowLeftIcon, ArrowUpIcon, ArrowDownIcon } from '@radix-ui/react-icons';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { SectionContainer } from '../../../components/ui/section-container';
import dynamic from 'next/dynamic';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.bubble.css';

const pb = new PocketBase('https://mmhs.pockethost.io');

export default function PostPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<RecordModel | null>(null);
  const [comments, setComments] = useState<RecordModel[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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

  useEffect(() => {
    if (post?.title) document.title = post.title;
  }, [post?.title]);

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (!isLoggedIn) {
      alert('Please log in to vote.');
      return;
    }
    if (!post) return;

    try {
      const updatedVotes = post.upvotes + (voteType === 'upvote' ? 1 : -1);
      await pb.collection('posts').update(id, { upvotes: updatedVotes });
      setPost((prev) => (prev ? { ...prev, upvotes: updatedVotes } : null));
    } catch (error) {
      console.error('Error voting on post:', error);
    }
  };

  const handleAddComment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isLoggedIn) {
      alert('Please log in to comment.');
      return;
    }
    try {
      if (!pb.authStore.model) {
        alert('Session expired. Please log in again.');
        return;
      }

      const data = {
        body: newComment,
        post: id,
        author: pb.authStore.model.id,
      };

      await pb.collection('comments').create(data);
      setNewComment('');
      fetchComments();
    } catch (error) {
      console.error('Error adding comment:', error);
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

        {/* Post body */}
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

        {/* Comments */}
        <h2 className="text-xl font-bold text-foreground mb-4">
          {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
        </h2>

        <div className="flex flex-col gap-3 mb-8">
          {comments.length === 0 ? (
            <p className="text-sm text-foreground-lighter italic">No comments yet.</p>
          ) : (
            comments.map((comment) => (
              <Card key={comment.id}>
                <CardContent className="py-5 px-5 border-none">
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

        {/* Add comment */}
        <form onSubmit={handleAddComment} className="space-y-3">
          <label
            htmlFor="newComment"
            className="block text-sm font-medium text-foreground-light"
          >
            Add a comment
          </label>
          <textarea
            id="newComment"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={isLoggedIn ? 'Share your thoughts…' : 'Log in to comment.'}
            disabled={!isLoggedIn}
            rows={4}
            className="w-full p-3 rounded-md border border-border-strong bg-surface-100 text-sm text-foreground placeholder:text-foreground-lighter focus:outline-none focus:border-brand-highlight disabled:opacity-50 disabled:cursor-not-allowed"
            required
          />
          <Button type="primary" size="medium" htmlType="submit" disabled={!isLoggedIn}>
            Add comment
          </Button>
        </form>
      </SectionContainer>
    </div>
  );
}
