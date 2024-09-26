// src/components/CreatePost.jsx
import React, { useState } from 'react';
import PocketBase from 'pocketbase';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/Login'; // Import the LoginForm component

const pb = new PocketBase('https://mmhs.pockethost.io');

export default function CreatePost() {
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostBody, setNewPostBody] = useState('');
  const [error, setError] = useState(null); // For handling errors
  const navigate = useNavigate();

  const handleCreatePost = async (e) => {
    e.preventDefault();

    // Check if the user is logged in
    if (!pb.authStore.isValid) {
      setError("You need to log in to create a post.");
      return;
    }

    try {
      const data = {
        title: newPostTitle,
        body: newPostBody,
        author: pb.authStore.model.id, // Use the logged-in user's ID
        upvotes: 0,
      };

      // Create the post and get the created post's ID
      const createdPost = await pb.collection('posts').create(data);

      // Redirect to the new post page using its ID
      navigate(`/forum/${createdPost.id}`);

      // Clear the input fields
      setNewPostTitle('');
      setNewPostBody('');
      setError(null); // Reset error if successful
      
    } catch (error) {
      console.error('Error creating post:', error);
      setError("An error occurred while creating the post.");
    }
  };

  return (
    <div className='m-16'>
      {pb.authStore.isValid ? ( // Conditionally render based on authentication status
        <>
          <h2 className='text-2xl mb-4'>New Post</h2>
          
          {error && <p className="text-red-500 mb-4">{error}</p>} {/* Display error message */}
          
          <form onSubmit={handleCreatePost} className="space-y-2">
            <input
              type="text"
              value={newPostTitle}
              onChange={(e) => setNewPostTitle(e.target.value)}
              placeholder="Post Title"
              className="w-full p-2 border rounded"
              required
            />
            <textarea
              value={newPostBody}
              onChange={(e) => setNewPostBody(e.target.value)}
              placeholder="Post Body"
              className="w-full p-2 border rounded"
              rows="3"
              required
            />
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Create Post
            </button>
          </form>
        </>
      ) : (
        <LoginForm onLoginSuccess={() => { setError(null); }} />
      )}
    </div>
  );
}