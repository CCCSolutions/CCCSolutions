'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PocketBase, { RecordModel } from 'pocketbase';
import { Button, Card } from '@radix-ui/themes';
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
        requestKey: `post_${id}`
      });
      setPost(record);
    } catch (error) {
      const err = error as { isAbort?: boolean };
      if (!err.isAbort) {
        console.error("Error fetching post:", error);
      }
    }
  }, [id]);

  const fetchComments = useCallback(async () => {
    try {
      const resultList = await pb.collection('comments').getList(1, 50, {
        filter: `post="${id}"`,
        sort: '-created',
        expand: 'author',
        requestKey: `comments_${id}`
      });
      setComments(resultList.items);
    } catch (error) {
      const err = error as { isAbort?: boolean };
      if (!err.isAbort) {
        console.error("Error fetching comments:", error);
      }
    }
  }, [id]);

  useEffect(() => {
    setIsLoggedIn(pb.authStore.isValid);
    fetchPost();
    fetchComments();
  }, [id, fetchPost, fetchComments]);

  useEffect(() => {
    if (post?.title) {
      document.title = post.title;
    }
  }, [post?.title]);

  const handleVote = async (voteType: string) => {
    if (!isLoggedIn) {
      alert("Please log in to vote.");
      return;
    }

    try {
      const updatedVotes = post!.upvotes + (voteType === 'upvote' ? 1 : -1);

      await pb.collection('posts').update(id, {upvotes: updatedVotes});
      setPost((prevPost) => prevPost ? ({
        ...prevPost,
        upvotes: updatedVotes,
      }) : null);
    } catch (error) {
      console.error("Error voting on post:", error);
    }
  };

  const handleAddComment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isLoggedIn) {
      alert("Please log in to comment.");
      return;
    }
    try {
      const data = {
        body: newComment,
        post: id,
        author: pb.authStore.model!.id,
      };

      await pb.collection('comments').create(data);

      setNewComment('');
      fetchComments();
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  if (!post) return <div className="container mx-auto p-6">Loading...</div>;

  return (
      <div className="font-poppins">
        <div className="container mx-auto px-4 py-8">
          <Link href="/forum" className="text-blue-500 hover:underline mb-6 inline-block">← Back to Forum</Link>

          <Card size="3" variant="surface" className="mb-8">
            <h1 className="text-3xl font-bold mb-4 text-gray-800">{post.title}</h1>

            <ReactQuill
                value={post.body}
                readOnly={true}
                theme="bubble"
                className="text-gray-700 leading-relaxed text-lg mb-4"
            />
            <div className="flex items-center space-x-6">
            <span className="text-gray-500 text-sm">
              By {post.expand?.author?.username || 'Unknown'} on {new Date(post.created).toLocaleDateString()}
            </span>

              <div className="flex items-center space-x-1">
                <button
                    onClick={() => handleVote('upvote')}
                    className="text-green-500 hover:text-green-600"
                >
                  ▲
                </button>
                <span className="font-semibold text-lg">{post.upvotes}</span>
                <button
                    onClick={() => handleVote('downvote')}
                    className="text-red-500 hover:text-red-600"
                >
                  ▼
                </button>
              </div>
            </div>
          </Card>

          <div className="mt-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Comments</h2>

            <div className="space-y-4">
              {comments.map((comment) => (
                  <Card key={comment.id} size="2" variant="surface">
                    <p className="text-gray-700">{comment.body}</p>
                    <div className="mt-2 text-sm text-gray-500">
                      By {comment.expand?.author?.username || 'Unknown'} on{' '}
                      {new Date(comment.created).toLocaleDateString()}
                    </div>
                  </Card>
              ))}
            </div>

            <form onSubmit={handleAddComment} className="my-6">
            <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                required
            />
              <Button type="submit" color="indigo" variant="solid" size="2" className="mt-3">
                Add Comment
              </Button>
            </form>
          </div>
        </div>
      </div>
  );
}
