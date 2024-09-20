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

  return (
    <div className="p-6">
      <h1 className="text-4xl font-bold text-center text-gray-800 mb-10">
        Forums
      </h1>
        <div className="text-xl text-center">
            This Version Does Not Have Forums: Contact willi64645@gmail.com for solutions/test-cases. If you would like to help finish the forum, feel free to check out https://github.com/Tankman61/mmhs-website and make a pull request.
        </div>
      <div className="bg-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {forums.map(forum => (
              <ClickableCard title={forum.title} description={forum.description} link={`forum/${forum.id}`}/>
          ))}
      </div>
    </div>
  );
};

export default ForumList;
