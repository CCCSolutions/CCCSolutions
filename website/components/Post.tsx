import React from 'react';

interface PostProps {
  user: string;
  content: string;
  created_at: string;
  contributions: string;
  username_color: string;
}

const Post = ({user, content, created_at, contributions, username_color}: PostProps) => {
  return (
    <div className="p-6">
      <div className="postheader">
        <h3 className="text-2xl font-semibold mb-2">{user}</h3>
      </div>
      <div className="postcontent">
        <p className="text-gray-700">{content}</p>
      </div>
      <div className="postfooter">
        <p>created at {created_at}</p>         {/*should bbe right aligned*/}
      </div>
    </div>
  );
};

export default Post;
