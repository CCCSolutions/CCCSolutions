'use client';

import React, { useState, useEffect } from 'react';
import PocketBase, { RecordModel, AuthModel } from 'pocketbase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card } from '@radix-ui/themes';
import dynamic from 'next/dynamic';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.bubble.css';

const pb = new PocketBase('https://mmhs.pockethost.io');

export default function ForumPage() {
  const [posts, setPosts] = useState<RecordModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('new');
  const [user, setUser] = useState<AuthModel | null>(null);

  const router = useRouter();

  useEffect(() => {
    setUser(pb.authStore.model);
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [sortBy]);

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

  const handleVote = async (postId: string, voteType: string) => {
    if (!user) {
      alert("Please log in to vote.");
      return;
    }
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;
      const updatedVotes = voteType === 'upvote' ? post.upvotes + 1 : post.upvotes - 1;

      await pb.collection('posts').update(postId, { upvotes: updatedVotes });
      fetchPosts();
    } catch (error) {
      console.error('Error voting on post:', error);
    }
  };

  const handleLogout = () => {
    pb.authStore.clear();
    setUser(null);
  };

  return (
    <div className="font-poppins">
      <div className="relative overflow-hidden bg-indigo-900 text-white py-16 px-4">

        <div className="relative z-10 container mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4">Forums</h1>
          <p className="text-xl md:text-2xl max-w-2xl mx-auto mb-5">
            Ask, search, or answer any question related to the CCC.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="text-right pt-8">
          {user ? (
            <p className="text-sm">
              Logged in as <span className="font-semibold">{user.username}</span> |{' '}
              <button className="cursor-pointer underline" onClick={handleLogout}>
                Logout
              </button>
            </p>
          ) : (
            <p className="text-sm italic">
              Not logged in |{' '}
              <button className="cursor-pointer underline" onClick={() => router.push('/login')}>
                Login
              </button>
            </p>
          )}
        </div>

        <div className="py-8">
          <div className="flex justify-between mb-4">
            <div className="flex items-center gap-1">
              <span className="mr-2">Sort by:</span>
              {['new', 'top'].map(option => (
                <Button
                  key={option}
                  onClick={() => setSortBy(option)}
                  color={sortBy === option ? 'indigo' : 'gray'}
                  variant="solid"
                  size="1"
                  className="cursor-pointer"
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </Button>
              ))}
            </div>

            <Button asChild color="indigo" variant="solid" size="2">
              <Link href="/create-post">
                Create New Post
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="text-center">Loading posts...</div>
          ) : (
            <div className="space-y-4">
              {posts.map(post => (
                <Card key={post.id} size="3" variant="surface">
                  <h2 className="text-xl font-semibold">
                    <Link href={`/forum/${post.id}`} className="hover:underline">
                      {post.title}
                    </Link>
                  </h2>
                  <ReactQuill
                    value={post.body.length > 200 ? post.body.substring(0, 200) + '...' : post.body}
                    readOnly={true}
                    theme="bubble"
                    className="text-gray-600 max-h-24 overflow-hidden"
                  />
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      By {post.expand?.author?.username || 'Unknown'} on {new Date(post.created).toLocaleDateString()}
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleVote(post.id, 'upvote')}
                        className="text-green-500 hover:text-green-600"
                        disabled={!user}
                        aria-label="Upvote"
                      >
                        ▲
                      </button>
                      <span>{post.upvotes}</span>
                      <button
                        onClick={() => handleVote(post.id, 'downvote')}
                        className="text-red-500 hover:text-red-600"
                        disabled={!user}
                        aria-label="Downvote"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
