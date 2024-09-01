import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ClickableCard from '../components/ClickableCard.jsx';

const ForumList = () => {
  const [forums, setForums] = useState([]);

  useEffect(() => { 
    axios.get('http://localhost:8000/forum/')
      .then(response => setForums(response.data))
      .catch(error => console.error('Error fetching data:', error));
  }, []);

  console.log("forum: ", forums)

  return (
    <div className="p-6">
      <h1 className="text-4xl font-bold text-center text-gray-800 mb-10">
        Forums
      </h1>
      <div className="bg-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {forums.map(forum => (
              <ClickableCard title={forum.title} description={forum.description} link={`forum/1`}/>
          ))}
      </div>
    </div>
  );
};

export default ForumList;
