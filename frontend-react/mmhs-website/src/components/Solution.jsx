import React, { useState, useEffect } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { solarizedlight } from "react-syntax-highlighter/dist/esm/styles/prism";

const Problem = ({ contestYear, problemCode }) => {
  const [solution, setSolution] = useState("Loading...");
  const [actualProblemCode, setActualProblemCode] = useState(problemCode);

  useEffect(() => {
    const fetchSolution = async () => {
      const alternativeCode = getAlternativeCode(problemCode);
      let solutionText = null;
      let foundCode = problemCode;

      for (const code of [problemCode, alternativeCode]) {
        if (!code) continue;
        const basePath = `/past_contests/${contestYear}/${code}`;
        try {
          const response = await fetch(`${basePath}/solution.txt`);
          const text = await response.text();
          if (!text.toLowerCase().includes('<!doctype html>')) {
            solutionText = text;
            foundCode = code;
            break;
          }
        } catch (error) {
          console.error(`Error fetching solution for ${code}:`, error);
        }
      }

      if (solutionText) {
        setSolution(solutionText);
        setActualProblemCode(foundCode);
      } else {
        setSolution("Solution does not currently exist. If you have a solution, please upload your solution along with commented explanation on our forum. Thank you!");
      }
    };

    fetchSolution();
  }, [contestYear, problemCode]);

  const getAlternativeCode = (code) => {
    const mapping = {
      'j5': 's3',
      'j4': 's2',
      'j3': 's1'
    };
    return mapping[code.toLowerCase()];
  };

  return (
    <div className="w-full p-8 rounded-lg">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        {`CCC ${contestYear} ${problemCode.toUpperCase()}`}
      </h2>

      {actualProblemCode !== problemCode && (
        <p className="text-sm text-gray-600 mb-4">
          Note: Showing solution for {actualProblemCode.toUpperCase()} as it's equivalent to {problemCode.toUpperCase()}.
        </p>
      )}

      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-700 mb-2">Solution:</h3>
        <SyntaxHighlighter language="cpp" style={solarizedlight} showLineNumbers>
          {solution}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export default Problem;