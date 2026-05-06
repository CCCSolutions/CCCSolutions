'use client';

import React, { useEffect, useState } from 'react';
import PocketBase from 'pocketbase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@radix-ui/react-icons';
import { Button } from '../../components/ui/button';
import { SectionContainer } from '../../components/ui/section-container';
import dynamic from 'next/dynamic';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';

const pb = new PocketBase('https://mmhs.pockethost.io');

export default function CreatePost() {
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostBody, setNewPostBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!pb.authStore.isValid) {
      router.push('/login');
    }
  }, [router]);

  const handleCreatePost = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!pb.authStore.isValid) {
      setError('You need to log in to create a post.');
      router.push('/login');
      return;
    }

    try {
      if (!pb.authStore.model) {
        setError('Session expired. Please log in again.');
        router.push('/login');
        return;
      }

      const data = {
        title: newPostTitle,
        body: newPostBody,
        author: pb.authStore.model.id,
        upvotes: 0,
      };

      const createdPost = await pb.collection('posts').create(data);

      router.push(`/forum/${createdPost.id}`);

      setNewPostTitle('');
      setNewPostBody('');
      setError(null);
    } catch (error) {
      console.error('Error creating post:', error);
      setError('An error occurred while creating the post.');
    }
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      ['code-block'],
      [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
      ['link', 'image'],
      ['clean'],
    ],
  };

  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'blockquote',
    'list',
    'indent',
    'link',
    'image',
    'code-block',
  ];

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

        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-8">
          New post
        </h1>

        {error && (
          <div className="bg-destructive-200 border border-destructive-400 text-destructive-600 px-4 py-3 rounded-md mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleCreatePost} className="max-w-3xl space-y-5">
          <div>
            <label
              htmlFor="postTitle"
              className="block text-sm font-medium text-foreground-light mb-1.5"
            >
              Title
            </label>
            <input
              id="postTitle"
              type="text"
              value={newPostTitle}
              onChange={(e) => setNewPostTitle(e.target.value)}
              placeholder="Enter your post title"
              className="w-full h-10 px-3 rounded-md border border-border-strong bg-surface-100 text-sm text-foreground placeholder:text-foreground-lighter focus:outline-none focus:border-brand-highlight"
              required
            />
          </div>

          <div>
            <label
              htmlFor="postBody"
              className="block text-sm font-medium text-foreground-light mb-1.5"
            >
              Content
            </label>
            <ReactQuill
              theme="snow"
              value={newPostBody}
              onChange={setNewPostBody}
              modules={modules}
              formats={formats}
              className="bg-surface-100 rounded-md"
            />
          </div>

          <Button type="primary" size="medium">
            Create post
          </Button>
        </form>
      </SectionContainer>
    </div>
  );
}
