import React from 'react';

// problem = {name: str, difficulty: str, tags:[str array], link:str}
// problems = [problem array]

const ProblemsTable = ({ problems }) => {
  return (
    <div className="m-8">
      <table className="w-full text-gray-700 dark:text-gray-400">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
            <th className="pl-4 py-3 text-left text-xs font-semibold uppercase">Problem Name</th>
            <th className="pr-4 md:pr-6 py-3 text-left text-xs font-semibold uppercase">Difficulty</th>
            <th className="pl-4 md:pl-6 py-3 text-left text-xs font-semibold uppercase">Tags</th>
          </tr>
        </thead>
        <tbody>
          {problems.map((problem, index) => (
            <React.Fragment key={index}>
              <tr className={`border-t border-gray-300 dark:border-gray-600 ${index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-900'}`}>
                <td className="pl-4 md:px-6 py-3 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center">
                    <a
                      href={problem.link}
                      className="truncate text-blue-600 dark:text-blue-300 hover:underline"
                      style={{ maxWidth: '20rem' }}
                    >
                      {problem.name}
                    </a>
                  </div>
                </td>

                <td className="py-3 whitespace-nowrap pr-4 md:pr-6">
                  <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-sm ${getDifficultyClass(problem.difficulty)}`}>
                    {problem.difficulty}
                  </span>
                </td>

                <td className="pl-4 md:pl-6 py-3 whitespace-nowrap text-sm font-medium">
                  <div className="flex flex-wrap gap-2">
                    {problem.tags.map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="bg-pastel-tag text-gray-800 dark:text-gray-200 px-2 py-1 rounded-md text-xs font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
              {(index + 1) % 5 === 0 && index !== problems.length - 1 && (
                <tr>
                    <td colSpan="3" className="py-4">
                        <div className="border-t-2 border-gray-300 dark:border-gray-600 my-4"></div>
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
      return 'bg-pastel-green text-green-800';
    case 'normal':
      return 'bg-pastel-blue text-blue-800';
    case 'hard':
      return 'bg-pastel-orange text-orange-800';
    case 'insane':
      return 'bg-pastel-red text-red-800';
    default:
      return 'bg-pastel-gray text-gray-800';
  }
};

export default ProblemsTable;
