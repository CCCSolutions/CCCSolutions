'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@radix-ui/react-icons';
import { Button } from '../../components/ui/button';
import { SectionContainer } from '../../components/ui/section-container';
import { useAuth } from '../../components/auth/AuthProvider';
import { apiFetch } from '../../lib/supabase';
import dynamic from 'next/dynamic';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';

export default function CreatePost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { push } = useRouter();
  const { state, profile } = useAuth();

  // Redirect unauthenticated users
  useEffect(() => {
    if (state === 'out') push('/login');
  }, [state, push]);

  // Redirect users who haven't completed onboarding
  useEffect(() => {
    if (state === 'in' && profile && /^user_\d+$/.test(profile.username)) {
      push('/onboarding');
    }
  }, [state, profile, push]);

  const handleCreatePost = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (state !== 'in') { push('/login'); return; }
    if (profile && /^user_\d+$/.test(profile.username)) { push('/onboarding'); return; }

    setError(null);
    setSubmitting(true);

    const res = await apiFetch('/forum/posts', {
      method: 'POST',
      body: JSON.stringify({ title, content }),
    });

    setSubmitting(false);

    if (res.ok) {
      const created = await res.json() as { id: string };
      push(`/forum/${created.id}`);
    } else {
      const body = await res.json().catch(() => ({})) as { error?: string };
      setError(body.error ?? 'An error occurred while creating the post.');
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

  if (state === 'pending') {
    return (
      <div className="bg-background text-foreground">
        <SectionContainer size="large" className="pt-12 pb-20">
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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
              value={content}
              onChange={setContent}
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
