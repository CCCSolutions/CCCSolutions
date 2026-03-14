'use client';

import React, { useEffect, useState } from 'react';
import PocketBase from 'pocketbase';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

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
      setError("You need to log in to create a post.");
      router.push('/login');
      return;
    }

    try {
      const data = {
        title: newPostTitle,
        body: newPostBody,
        author: pb.authStore.model!.id,
        upvotes: 0,
      };

      const createdPost = await pb.collection('posts').create(data);

      router.push(`/forum/${createdPost.id}`);

      setNewPostTitle('');
      setNewPostBody('');
      setError(null);
    } catch (error) {
      console.error('Error creating post:', error);
      setError("An error occurred while creating the post.");
    }
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      ['code-block'],
      [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
      ['link', 'image'],
      ['clean'],
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image',
    'code-block'
  ];

  return (
    <div className="font-poppins container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Create New Post</h1>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <p>{error}</p>
        </div>
      )}
      <form onSubmit={handleCreatePost} className="max-w-4xl mx-auto">
        <div className="mb-4">
          <label htmlFor="postTitle" className="block text-gray-700 text-sm font-bold mb-2">
            Post Title
          </label>
          <input
            id="postTitle"
            type="text"
            value={newPostTitle}
            onChange={(e) => setNewPostTitle(e.target.value)}
            placeholder="Enter your post title"
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="postBody" className="block text-gray-700 text-sm font-bold mb-2">
            Post Content
          </label>
          <ReactQuill
            theme="snow"
            value={newPostBody}
            onChange={setNewPostBody}
            modules={modules}
            formats={formats}
            className="bg-white"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-600 transition"
        >
          Create Post
        </button>
      </form>
    </div>
  );
}
