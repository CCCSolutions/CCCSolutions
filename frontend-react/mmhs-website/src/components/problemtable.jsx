import React from 'react';

// problem = {name: str, difficulty: str, tags:[str array], link:str}
// problems = [problem array]

const ProblemsTable = ({ problems }) => {
  return (
    <div className="m-8">
      <table className="w-full text-gray-700">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600">
            <th className="pl-6 py-3 text-left text-md font-normal">Problem Name</th>
            <th className="pr-6 py-3 text-left text-md font-normal">Difficulty</th>
            <th className="pl-6 py-3 text-left text-md font-normal">Tags</th>
          </tr>
        </thead>
        <tbody>
          {problems.map((problem, index) => (
            <React.Fragment key={index}>
              <tr className={`border-t border-gray-200 dark:border-gray-600 ${index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900' : 'bg-white dark:bg-gray-800'}`}>
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
              {(index + 1) % 5 === 0 && index !== problems.length - 1 && (
                <tr>
                  <td colSpan="3" className="py-3">
                    <div className="border-t-2 border-gray-400 my-4"></div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
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
