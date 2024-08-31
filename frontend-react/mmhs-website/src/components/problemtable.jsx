import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle } from 'react-feather';


const ProblemsTable = ({ problems }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const problemsPerPage = 20;

  // State to store solution status for each problem
  const [solutionStatuses, setSolutionStatuses] = useState({});

  useEffect(() => {
    // Fetch solution statuses for all problems
    const fetchSolutionStatuses = async () => {
      const statuses = {};
      for (const problem of problems) {
        const { link } = problem;
        const [year, code] = getYearAndCodeFromLink(link);
        const basePath = `/past_contests/${year}/${code}`;

        try {
          const response = await fetch(`${basePath}/solution.txt`);
          const text = await response.text();

          if (text.toLowerCase().includes('<!doctype html>')) {
            statuses[problem.name] = 'No Solution';
          } else {
            statuses[problem.name] = 'Has Solution';
          }
        } catch {
          statuses[problem.name] = 'No Solution';
        }
      }
      setSolutionStatuses(statuses);
    };

    fetchSolutionStatuses();
  }, [problems]);

  // Function to extract year and code from the problem link
  const getYearAndCodeFromLink = (link) => {
    const parts = link.split('/');
    const year = parts[2]; // Extract the year
    const code = parts[3].toLowerCase(); // Extract the problem code
    return [year, code];
  };

  // Calculate the total number of pages
  const totalPages = Math.ceil(problems.length / problemsPerPage);

  // Calculate the current problems to display based on the current page
  const currentProblems = problems.slice(
    (currentPage - 1) * problemsPerPage,
    currentPage * problemsPerPage
  );

  // Function to handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="overflow-x-auto m-8">
      <table className="w-full text-gray-700">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600">
            <th className="pl-6 py-3 text-left text-md font-normal">Solution</th>
            <th className="pl-6 py-3 text-left text-md font-normal">Problem Name</th>
            <th className="pr-6 py-3 text-left text-md font-normal">Difficulty</th>
            <th className="pl-6 py-3 text-left text-md font-normal">Tags</th>
          </tr>
        </thead>
        <tbody>
          {currentProblems.map((problem, index) => (
            <React.Fragment key={index}>
              <tr
                className={`border-t border-gray-200 dark:border-gray-600 ${index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900' : 'bg-white dark:bg-gray-800'}`}
              >
              <td className="py-3 whitespace-nowrap text-sm font-medium">
                  {solutionStatuses[problem.name] === 'Has Solution' ? (
                    <div className="px-10 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                  ) : solutionStatuses[problem.name] === 'No Solution' ? (
                    <div className="px-10 text-red-600">
                      <XCircle className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="px-10">
                      . . .
                    </div>
                  )}
                </td>


                <td className="pl-4 md:px-6 py-3 whitespace-nowrap text-sm font-medium">
                  <a
                    href={problem.link}
                    className="truncate text-blue-600 dark:text-blue-300 hover:underline"
                    style={{ maxWidth: '20rem' }}
                  >
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
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <div className="text-sm text-gray-600 dark:text-gray-300">
          Page {currentPage} of {totalPages}
        </div>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
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

export default ProblemsTable;
