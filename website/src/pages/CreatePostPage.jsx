import React, { useEffect, useState } from 'react';
import PocketBase from 'pocketbase';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const pb = new PocketBase('https://mmhs.pockethost.io');

export default function CreatePost() {
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostBody, setNewPostBody] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!pb.authStore.isValid) {
      navigate('/login');
    }
  }, [navigate]);

  const handleCreatePost = async (e) => {
    e.preventDefault();

    if (!pb.authStore.isValid) {
      setError("You need to log in to create a post.");
      navigate('/login');
      return;
    }

    try {
      const data = {
        title: newPostTitle,
        body: newPostBody,
        author: pb.authStore.model.id,
        upvotes: 0,
      };

      const createdPost = await pb.collection('posts').create(data);

      navigate(`/forum/${createdPost.id}`);

      setNewPostTitle('');
      setNewPostBody('');
      setError(null);
    } catch (error) {
      console.error('Error creating post:', error);
      setError("An error occurred while creating the post.");
    }
  };

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