import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Book, BookOpen, Info } from 'react-feather';

const ProblemsTable = ({ problems }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPage = parseInt(searchParams.get('page')) || 1;
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [solutionStatuses, setSolutionStatuses] = useState({});
  
  const problemsPerPage = 20;
  
  // Get the problems for the current page
  const currentProblems = problems.slice(
    (currentPage - 1) * problemsPerPage,
    currentPage * problemsPerPage
  );

  // Effect to fetch only the displayed problem solutions
  useEffect(() => {
    const fetchSolutionStatuses = async () => {
      const statuses = {};

      const fetchPromises = currentProblems.map(async (problem) => {
        const { link } = problem;
        const [year, code] = getYearAndCodeFromLink(link);
        
        // Only check for alternative code if year < 2025
        const alternativeCode = year < 2025 ? getAlternativeCode(code, year) : null;

        const pathsToCheck = [code, alternativeCode].filter(Boolean)
          .map((checkCode) => `/past_contests/${year}/${checkCode}/solution.txt`);

        for (const path of pathsToCheck) {
          try {
            const response = await fetch(path);
            const text = await response.text();
            if (!text.toLowerCase().includes('<!doctype html>')) {
              statuses[problem.name] = 'Has Solution';
              return;
            }
          } catch (error) {
            console.error(`Error fetching solution for ${problem.name}:`, error);
          }
        }

        statuses[problem.name] = 'No Solution';
      });

      await Promise.all(fetchPromises);
      setSolutionStatuses((prev) => ({ ...prev, ...statuses }));
    };

    fetchSolutionStatuses();
  }, [currentProblems]);

  // Update URL when page changes
  useEffect(() => {
    setSearchParams({ page: currentPage });
  }, [currentPage, setSearchParams]);

  const getYearAndCodeFromLink = (link) => {
    const parts = link.split('/');
    const year = parts[2];
    const code = parts[3].toLowerCase();
    return [year, code];
  };

  const getAlternativeCode = (code, year) => {
    if (year < 2016) {
      const mapping = { j5: 's3', j4: 's2', j3: 's1' };
      return mapping[code.toLowerCase()];
    }
    return null;
  };

  const totalPages = Math.ceil(problems.length / problemsPerPage);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const getDifficultyClass = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'normal':
        return 'bg-blue-100 text-blue-800';
      case 'hard':
        return 'bg-orange-100 text-orange-800';
      case 'insane':
        return 'bg-red-100 text-red-800';
      case 'wicked':
        return 'bg-purple-100 text-purple-800 evil-purple-glow';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="light-mode overflow-x-auto m-8 px-8">
      <table className="w-full text-gray-700 bg-white">
        <thead>
          <tr className="bg-gray-100 border-b border-gray-200">
            <th className="pl-6 py-3 text-left text-md font-normal">Solution</th>
            <th className="pl-6 py-3 text-left text-md font-normal">Problem Name</th>
            <th className="pr-6 py-3 text-left text-md font-normal">
              <div className="flex items-center space-x-2 relative">
                <span>Difficulty</span>
                <div className="relative group">
                  <Info className="w-4 h-4 text-gray-500 cursor-pointer" />
                  <div className="absolute left-1/2 transform -translate-x-1/2 top-full mt-2 hidden group-hover:block p-3 text-xs bg-slate-200 rounded z-10 whitespace-nowrap">
                    <div className="mb-1"><strong>Easy</strong> - an average grade 11 student should get this</div>
                    <div className="mb-1"><strong>Normal</strong> - an average grade 12 student should get this</div>
                    <div className="mb-1"><strong>Hard</strong> - a good grade 12 student MIGHT get this</div>
                    <div className="mb-1"><strong>Insane</strong> - the best grade 12 student MIGHT get this, given enough time</div>
                    <div><strong>Wicked</strong> - the teacher will get this after many days, or maybe never :-)</div>
                  </div>
                </div>
              </div>
            </th>
            <th className="pl-6 py-3 text-left text-md font-normal">Tags</th>
          </tr>
        </thead>
        <tbody>
          {currentProblems.map((problem, index) => (
            <tr key={index} className={`border-t border-gray-200 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
              <td className="py-3 whitespace-nowrap text-sm font-medium">
                {solutionStatuses[problem.name] === 'Has Solution' ? (
                  <div className="px-10 text-green-400">
                    <BookOpen className="w-5 h-5" />
                  </div>
                ) : solutionStatuses[problem.name] === 'No Solution' ? (
                  <div className="px-10 text-red-600">
                    <Book className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="px-10">. . .</div>
                )}
              </td>
              <td className="pl-4 md:px-6 py-3 whitespace-nowrap text-sm font-medium">
                <a href={problem.link} className="truncate text-blue-600 font-semibold hover:underline" style={{ maxWidth: '20rem' }}>
                  {problem.name}
                </a>
              </td>
              <td className="py-3 whitespace-nowrap pr-4 md:pr-6">
                <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-sm ${getDifficultyClass(problem.difficulty)}`}>
                  {problem.difficulty}
                </span>
              </td>
              <td className="pl-4 md:pl-6 py-3 whitespace-nowrap text-sm font-medium">
                {problem.tags.join(', ')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4">
        <button 
          onClick={() => handlePageChange(currentPage - 1)} 
          disabled={currentPage === 1} 
          className="px-4 py-2 bg-blue-900 text-white rounded transition-colors duration-300 hover:bg-blue-600 disabled:bg-gray-300 disabled:opacity-50"
        >
          Previous
        </button>
        <div className="text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </div>
        <button 
          onClick={() => handlePageChange(currentPage + 1)} 
          disabled={currentPage === totalPages} 
          className="px-4 py-2 bg-blue-800 text-white rounded transition-colors duration-300 hover:bg-blue-600 disabled:bg-gray-300 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ProblemsTable;