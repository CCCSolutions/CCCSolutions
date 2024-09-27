import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import PocketBase from 'pocketbase';

const pb = new PocketBase('https://mmhs.pockethost.io');

export default function PostPage() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkAuthStatus();
    fetchPost();
    fetchComments();
  }, [id]);

  const checkAuthStatus = () => {
    const isAuth = pb.authStore.isValid;
    setIsLoggedIn(isAuth);
  };

  const fetchPost = async () => {
    try {
      const record = await pb.collection('posts').getOne(id, {
        expand: 'author',
        requestKey: `post_${id}`
      });
      setPost(record);
    } catch (error) {
      if (error.name !== 'ClientResponseError' || !error.message.includes('autocancelled')) {
        console.error("Error fetching post:", error);
      }
    }
  };

  const fetchComments = async () => {
    try {
      const resultList = await pb.collection('comments').getList(1, 50, {
        filter: `post="${id}"`,
        sort: '-created',
        expand: 'author',
        requestKey: `comments_${id}`
      });
      setComments(resultList.items);
    } catch (error) {
      if (error.name !== 'ClientResponseError' || !error.message.includes('auto cancelled')) {
        console.error("Error fetching comments:", error);
      }
    }
  };

  const handleVote = async (voteType) => {
    if (!isLoggedIn) {
      alert("Please log in to vote.");
      return;
    }

    try {
      const updatedVotes = post.upvotes + (voteType === 'upvote' ? 1 : -1);

      await pb.collection('posts').update(id, { upvotes: updatedVotes });
      setPost((prevPost) => ({
        ...prevPost,
        upvotes: updatedVotes,
      }));
    } catch (error) {
      console.error("Error voting on post:", error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      alert("Please log in to comment.");
      return;
    }
    try {
      const data = {
        body: newComment,
        post: id,
        author: pb.authStore.model.id,
      };

      await pb.collection('comments').create(data);

      setNewComment('');
      fetchComments();
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  if (!post) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-6">
      <title>New Post</title>
      <Link to="/forum" className="text-blue-500 hover:underline mb-6 inline-block">← Back to Forum</Link>

      <div className="bg-white shadow-md p-6 rounded-lg">
        <h1 className="text-3xl font-bold mb-4 text-gray-800">{post.title}</h1>

        <div className="text-gray-700 leading-relaxed text-lg mb-4">
          {post.body}
        </div>

        <div className="flex items-center space-x-6 mb-6">
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
      </div>


      {/* Comments Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Comments</h2>
        
        
        {/* Display Comments */}
        <div className="space-y-4">
            {comments.map((comment) => (
            <div
                key={comment.id}
                className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm"
            >
                <p className="text-gray-700">{comment.body}</p>
                <div className="mt-2 text-sm text-gray-500">
                By {comment.expand?.author?.username || 'Unknown'} on{' '}
                {new Date(comment.created).toLocaleDateString()}
                </div>
            </div>
            ))}
        </div>

        <form onSubmit={handleAddComment} className="my-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="4"
            required
          />
          <button
            type="submit"
            className="mt-3 bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 transition"
          >
            Add Comment
          </button>
        </form>
      </div>
    </div>
  );
}