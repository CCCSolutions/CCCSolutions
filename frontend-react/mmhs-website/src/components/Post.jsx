import React from 'react';
import { Link } from 'react-router-dom';

const Post = ({user, content, created_at, contributions, username_color}) => {
  return (
    <div className="p-6">
      <div className="postheader">
        <h3 className="text-2xl font-semibold mb-2">{user}</h2>
      </div>
      <div> className="postcontent">
        <p className="text-gray-700">{content}</p>
      </div>
      <div className="postfooter">
        <p>created at {created_at}</p>         {/*should bbe right aligned*/}
      </div>
    </div>
  );
};

export default Post;
