'use client';

import React, { useEffect, useRef, useState } from 'react';
import PocketBase from 'pocketbase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@radix-ui/react-icons';
import { toast } from 'sonner';
import { isPostCommitHookBug } from '../../lib/pocketbase-bug';
import { Button } from '../../components/ui/button';
import { SectionContainer } from '../../components/ui/section-container';
import dynamic from 'next/dynamic';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';

const pb = new PocketBase('https://mmhs.pockethost.io');

export default function CreatePost() {
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostBody, setNewPostBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Ref, not state: setSubmitting only lands on the next render, so rapid clicks
  // would all read submitting === false and each fire a create().
  const submittingRef = useRef(false);
  const { push } = useRouter();

  useEffect(() => {
    if (!pb.authStore.isValid) {
      push('/login');
    }
  }, [push]);

  const handleCreatePost = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!pb.authStore.isValid) {
      toast.warning('You need to log in to create a post.');
      push('/login');
      return;
    }
    if (submittingRef.current) return;

    if (!pb.authStore.model) {
      toast.warning('Session expired. Please log in again.');
      push('/login');
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    const authorId = pb.authStore.model.id;
    try {
      const createdPost = await pb.collection('posts').create(
        {
          title: newPostTitle,
          body: newPostBody,
          author: authorId,
          upvotes: 0,
        },
        { requestKey: null } // opt out of auto-cancellation; see PostPageClient
      );

      toast.success('Post created.');
      push(`/forum/${createdPost.id}`);
    } catch (error) {
      const err = error as { isAbort?: boolean };

      // The post actually saved; PocketHost's broken hook just reports 400, and it
      // swallows the created record with it. Look the post back up so we can still
      // land the user on it. See lib/pocketbase-bug.ts.
      if (isPostCommitHookBug(error)) {
        toast.success('Post created.');
        try {
          const recent = await pb.collection('posts').getList(1, 1, {
            filter: `author="${authorId}"`,
            sort: '-created',
            requestKey: null,
          });
          const id = recent.items[0]?.id;
          push(id ? `/forum/${id}` : '/forum');
        } catch {
          push('/forum');
        }
        return;
      }

      if (!err.isAbort) {
        console.error('Error creating post:', error);
        toast.error('Could not create the post.');
      }
      submittingRef.current = false;
      setSubmitting(false);
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

          <Button type="primary" size="medium" htmlType="submit" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create post'}
          </Button>
        </form>
      </SectionContainer>
    </div>
  );
}
