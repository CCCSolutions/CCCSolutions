'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Cross2Icon, ReaderIcon, InfoCircledIcon } from '@radix-ui/react-icons';
import { Button } from '../ui/button';
import { problems } from '../../constants';

const ProblemsTable = () => {
  const searchParams = useSearchParams();
  const initialPage = parseInt(searchParams.get('page') || '1') || 1;
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [showDifficultyInfo, setShowDifficultyInfo] = useState(false);
  const difficultyInfoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (difficultyInfoRef.current && !difficultyInfoRef.current.contains(e.target as Node)) {
        setShowDifficultyInfo(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const problemsPerPage = 20;

  const currentProblems = problems.slice(
    (currentPage - 1) * problemsPerPage,
    currentPage * problemsPerPage
  );

  useEffect(() => {
    window.history.replaceState(null, '', `?page=${currentPage}`);
  }, [currentPage]);

  const totalPages = Math.ceil(problems.length / problemsPerPage);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const getDifficultyClass = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'normal':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'hard':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'insane':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'wicked':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      default:
        return 'bg-surface-200 text-foreground-light';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm table-fixed">
        <thead>
          <tr className="bg-surface-300 border-b border-border-default text-foreground">
            <th className="w-28 pl-6 py-3 text-left font-medium">Solution</th>
            <th className="w-[45%] pl-4 md:pl-6 py-3 text-left font-medium">Problem Name</th>
            <th className="w-32 pr-6 py-3 text-left font-medium">
              <div className="flex items-center gap-2 relative">
                <span className="leading-none">Difficulty</span>
                <div className="relative group leading-none" ref={difficultyInfoRef}>
                  <button
                    type="button"
                    onClick={() => setShowDifficultyInfo((v) => !v)}
                    className="inline-flex items-center leading-none p-0 border-0 bg-transparent text-foreground-lighter cursor-pointer"
                    aria-label="Difficulty legend"
                  >
                    <InfoCircledIcon width="16" height="16" />
                  </button>
                  <div
                    className={`absolute left-1/2 transform -translate-x-1/2 top-full mt-2 ${
                      showDifficultyInfo ? 'block' : 'hidden'
                    } md:group-hover:block w-64 p-3 text-xs bg-surface-100 border border-border-default rounded-md text-foreground-light z-10 whitespace-normal`}
                  >
                    <div className="mb-1">
                      <strong className="text-foreground font-medium">Easy</strong>: an average
                      grade 11 student should get this
                    </div>
                    <div className="mb-1">
                      <strong className="text-foreground font-medium">Normal</strong>: an average
                      grade 12 student should get this
                    </div>
                    <div className="mb-1">
                      <strong className="text-foreground font-medium">Hard</strong>: a good grade 12
                      student MIGHT get this
                    </div>
                    <div className="mb-1">
                      <strong className="text-foreground font-medium">Insane</strong>: the best
                      grade 12 student MIGHT get this, given enough time
                    </div>
                    <div>
                      <strong className="text-foreground font-medium">Wicked</strong>: the teacher
                      will get this after many days, or maybe never :-)
                    </div>
                  </div>
                </div>
              </div>
            </th>
            <th className="pl-4 md:pl-6 py-3 text-left font-medium">Tags</th>
          </tr>
        </thead>
        <tbody>
          {currentProblems.map((problem) => (
            <tr
              key={problem.name}
              className="border-b border-border-default hover:bg-surface-200/50 transition-colors"
            >
              <td className="py-3 whitespace-nowrap">
                {problem.hasSolution ? (
                  <div className="px-10 text-green-600 dark:text-green-400">
                    <ReaderIcon width="20" height="20" />
                  </div>
                ) : (
                  <div className="px-10 text-destructive">
                    <Cross2Icon width="20" height="20" />
                  </div>
                )}
              </td>
              <td className="pl-4 md:px-6 py-3 overflow-hidden">
                <Link
                  href={problem.link}
                  className="block truncate text-brand font-medium hover:underline"
                >
                  {problem.name}
                </Link>
              </td>
              <td className="py-3 whitespace-nowrap pr-4 md:pr-6">
                <span
                  className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-xs ${getDifficultyClass(
                    problem.difficulty
                  )}`}
                >
                  {problem.difficulty}
                </span>
              </td>
              <td className="pl-4 md:pl-6 py-3 truncate text-foreground-light">
                {problem.tags.join(', ')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-6 px-2">
        <Button
          type="default"
          size="small"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <div className="text-sm text-foreground-light">
          Page {currentPage} of {totalPages}
        </div>
        <Button
          type="primary"
          size="small"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default ProblemsTable;
