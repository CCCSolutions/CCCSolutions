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
        <div>
          {/* Header section */}
          <div className="bg-gradient-to-r from-blue-800 to-indigo-900 text-white py-16 px-4">
            <div className="container mx-auto flex flex-col items-center text-center">
              <h1 className="text-5xl font-bold mb-4">Forums</h1>
              <p className="text-xl max-w-2xl mb-5">
              </p>
            </div>
          </div>

          {/* Forums Grid */}
          <div className="bg-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {forums.length > 0 ? (
                forums.map((forum) => (
                    <ClickableCard
                        key={forum.id}
                        title={forum.title}
                        description={forum.description}
                        link={`forum/${forum.id}`}
                    />
                ))
            ) : (
                <p>                This Version Does Not Have Forums: Contact willi64645@gmail.com for solutions/test-cases. If you would
                like
                to help finish the forum, feel free to check out{' '}
                <a href="https://github.com/Tankman61/mmhs-website" className="underline">
                  https://github.com/Tankman61/mmhs-website
                </a>{' '}
                and make a pull request.</p>
            )}
          </div>
        </div>
    );
  };

export default ForumList;
