import React, { useState, useEffect, useRef } from 'react';

const SearchBar = ({ problems }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchBarRef = useRef(null);

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    setIsDropdownOpen(query.length > 0); // Open dropdown if query is not empty
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsDropdownOpen(false); // Close dropdown when clearing
  };

  // Click outside detection
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchBarRef.current && !searchBarRef.current.contains(event.target)) {
        setIsDropdownOpen(false); // Close dropdown if clicked outside
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filtered problems based on the search query
  const filteredProblems = problems.filter((problem) =>
    problem.name.toLowerCase().includes(searchQuery) ||
    problem.difficulty.toLowerCase().includes(searchQuery) ||
    problem.tags.some((tag) => tag.toLowerCase().includes(searchQuery))
  );

  return (
    <div ref={searchBarRef} className="w-full max-w-lg m-6 m-2b relative">
      <div className="relative">
        <input
          type="text"
          placeholder="Search for a problem..."
          value={searchQuery}
          onChange={handleSearch}
          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {/* Clear Button */}
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            &times;
          </button>
        )}
      </div>
      {/* Dropdown that displays results */}
      {isDropdownOpen && (
        <div className="absolute w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
          {filteredProblems.length > 0 ? (
            <ul className="space-y-2 p-2">
              {filteredProblems.map((problem) => (
                <li key={problem.name} className="p-4 border-b last:border-none bg-white hover:bg-gray-100 transition">
                  <a href={problem.link} className="text-indigo-600 font-medium">
                    {problem.name}
                  </a>
                  <p className="text-sm text-gray-500">Difficulty: {problem.difficulty}</p>
                  <p className="text-xs text-gray-400">Tags: {problem.tags.join(', ')}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 p-4">No problems found.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
