import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ClickableCard from '../components/ClickableCard.jsx';

const Forum = ({forumId}) => {
  const [threads, setThreads] = useState({"title": "loading...", "description": "loading...", "threads": []});

  console.log("forumId is ", forumId)

  useEffect(() => { 
    axios.get(`http://localhost:8000/forum/${forumId}`)
      .then(response => setThreads(response.data))
      .catch(error => console.error('Error fetching data:', error));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-4xl font-bold text-center text-gray-800 mb-10">
        {threads.title}
      </h1>
      <p>
        {threads.description}
      </p>
      <div className="bg-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {threads.threads.map(thread => (
              <ClickableCard title={thread.title} description={thread.description} link={thread.id}/>
          ))}
      </div>
    </div>
  );
};

export default Forum;
