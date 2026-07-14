'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { MagnifyingGlassIcon, Cross2Icon } from '@radix-ui/react-icons';
import { Problem } from '../../constants';

interface SearchBarProps {
  problems: Problem[];
}

const SearchBar = ({ problems }: SearchBarProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownRect, setDropdownRect] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const [mounted, setMounted] = useState(false);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = () => {
    if (searchBarRef.current) {
      const rect = searchBarRef.current.getBoundingClientRect();
      setDropdownRect({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    const open = query.length > 0;
    setIsDropdownOpen(open);
    if (open) updatePosition();
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedInSearchBar = searchBarRef.current && searchBarRef.current.contains(target);
      const clickedInDropdown = dropdownRef.current && dropdownRef.current.contains(target);

      if (!clickedInSearchBar && !clickedInDropdown) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isDropdownOpen) return;

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isDropdownOpen]);

  const filteredProblems = problems.filter(
    (problem) =>
      problem.name.toLowerCase().includes(searchQuery) ||
      problem.difficulty.toLowerCase().includes(searchQuery) ||
      problem.tags.some((tag) => tag.toLowerCase().includes(searchQuery))
  );

  const dropdown =
    isDropdownOpen && dropdownRect ? (
      <div
        ref={dropdownRef}
        style={{
          position: 'absolute',
          top: dropdownRect.top,
          left: dropdownRect.left,
          width: dropdownRect.width,
        }}
        className="bg-surface-100 border border-border-default rounded-md z-50 max-h-72 overflow-y-auto shadow-lg"
      >
        {filteredProblems.length > 0 ? (
          <ul>
            {filteredProblems.map((problem) => (
              <li
                key={problem.name}
                className="border-b border-border-default last:border-none hover:bg-surface-200/60 transition-colors"
              >
                <Link href={problem.link} className="block p-4">
                  <span className="text-brand font-medium hover:underline">{problem.name}</span>
                  <p className="text-sm text-foreground-light mt-1">
                    Difficulty: {problem.difficulty}
                  </p>
                  <p className="text-xs text-foreground-lighter mt-0.5">
                    Tags: {problem.tags.join(', ')}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-foreground-light p-4 text-sm">No problems found.</p>
        )}
      </div>
    ) : null;

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

      {mounted && dropdown && createPortal(dropdown, document.body)}
    </div>
  );
};

export default SearchBar;
