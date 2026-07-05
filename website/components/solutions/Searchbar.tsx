'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { MagnifyingGlassIcon, Cross2Icon } from '@radix-ui/react-icons';
import { Problem } from '../../constants';

interface SearchBarProps {
  problems: Problem[];
}

const SearchBar = ({ problems }: SearchBarProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchBarRef = useRef<HTMLDivElement>(null);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    setIsDropdownOpen(query.length > 0);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBarRef.current && !searchBarRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredProblems = problems.filter(
    (problem) =>
      problem.name.toLowerCase().includes(searchQuery) ||
      problem.difficulty.toLowerCase().includes(searchQuery) ||
      problem.tags.some((tag) => tag.toLowerCase().includes(searchQuery))
  );

  return (
    <div ref={searchBarRef} className="w-full relative">
      <div className="relative">
        <MagnifyingGlassIcon
          width="16"
          height="16"
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-lighter pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search for a problem…"
          value={searchQuery}
          onChange={handleSearch}
          className="w-full h-10 pl-10 pr-10 rounded-md border border-border-strong bg-surface-100 text-sm text-foreground placeholder:text-foreground-lighter focus:outline-none focus:border-brand-highlight"
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-lighter hover:text-foreground focus:outline-none"
          >
            <Cross2Icon width="14" height="14" />
          </button>
        )}
      </div>

      {isDropdownOpen && (
        <div className="absolute w-full mt-2 bg-surface-100 border border-border-default rounded-md z-50 max-h-72 overflow-y-auto">
          {filteredProblems.length > 0 ? (
            <ul>
              {filteredProblems.map((problem) => (
                <li
                  key={problem.name}
                  className="p-4 border-b border-border-default last:border-none hover:bg-surface-200/60 transition-colors"
                >
                  <Link href={problem.link} className="text-brand font-medium hover:underline">
                    {problem.name}
                  </Link>
                  <p className="text-sm text-foreground-light mt-1">
                    Difficulty: {problem.difficulty}
                  </p>
                  <p className="text-xs text-foreground-lighter mt-0.5">
                    Tags: {problem.tags.join(', ')}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-foreground-light p-4 text-sm">No problems found.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
