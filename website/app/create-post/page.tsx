'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@radix-ui/react-icons';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { SectionContainer } from '../../components/ui/section-container';
import { supabase, apiFetch } from '../../lib/supabase';
import type { Session } from '@supabase/supabase-js';
import dynamic from 'next/dynamic';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';

export default function CreatePost() {
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostBody, setNewPostBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [checkedSession, setCheckedSession] = useState(false);
  // Ref, not state: setSubmitting only lands on the next render, so rapid clicks
  // would all read submitting === false and each fire a create().
  const submittingRef = useRef(false);
  const { push } = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCheckedSession(true);
      if (!data.session) push('/login');
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (!s) push('/login');
    });
    return () => listener.subscription.unsubscribe();
  }, [push]);

  const handleCreatePost = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!session) {
      toast.warning('You need to log in to create a post.');
      push('/login');
      return;
    }
    if (submittingRef.current) return;

    submittingRef.current = true;
    setSubmitting(true);
    try {
      const res = await apiFetch('/forum/posts', {
        method: 'POST',
        body: JSON.stringify({ title: newPostTitle, content: newPostBody }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Failed to create post (${res.status})`);
      }
      const createdPost = (await res.json()) as { id: string };
      toast.success('Post created.');
      push(`/forum/${createdPost.id}`);
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Could not create the post.');
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

  if (checkedSession && !session) {
    return null;
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
