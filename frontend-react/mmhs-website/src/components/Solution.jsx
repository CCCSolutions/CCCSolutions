import React, { useState, useEffect } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { solarizedlight } from "react-syntax-highlighter/dist/esm/styles/prism";

const Problem = ({ contestYear, problemCode }) => {
  const [solutions, setSolutions] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [actualProblemCode, setActualProblemCode] = useState(problemCode);

  useEffect(() => {
    const fetchSolutions = async () => {
      const alternativeCode = getAlternativeCode(problemCode);
      let foundCode = problemCode;
      const solutionsArray = [];

      for (const code of [problemCode, alternativeCode]) {
        if (!code) continue;
        const basePath = `/past_contests/${contestYear}/${code}`;

        for (let i = 1; i <= 5; i++) {
          try {
            const response = await fetch(`${basePath}/solution${i === 1 ? "" : i}.txt`);
            const text = await response.text();
            if (!text.toLowerCase().includes("<!doctype html>")) {
              solutionsArray.push(text);
              foundCode = code;
            }
          } catch (error) {
            console.error(`Error fetching solution${i} for ${code}:`, error);
          }
        }
      }

      if (solutionsArray.length > 0) {
        setSolutions(solutionsArray);
        setActualProblemCode(foundCode);
      } else {
        setSolutions([
          "Solution does not currently exist. If you have a solution, please upload your solution along with commented explanation on our forum. Thank you!",
        ]);
      }
    };

    fetchSolutions();
  }, [contestYear, problemCode]);

  const getAlternativeCode = (code) => {
    const mapping = {
      j5: contestYear >= 2016 ? "s2" : "s3",
      j4: contestYear >= 2016 ? "s1" : "s2",
      j3: "s1",
    };
    return mapping[code.toLowerCase()];
  };

  return (
    <div className="bg-gray-200 min-h-screen p-8">
      <div className="w-full p-8 rounded-lg bg-white shadow-md">
        <h2 className="text-2xl font-semibold text-black mb-4">
          {`CCC ${contestYear} ${problemCode.toUpperCase()}`}
        </h2>

        {actualProblemCode !== problemCode && (
          <p className="text-sm text-gray-600 mb-4">
            Note: Showing solution for {actualProblemCode.toUpperCase()} as it's
            equivalent to {problemCode.toUpperCase()}.
          </p>
        )}

        <div className="mb-6">
          <h3 className="text-lg font-medium text-black mb-2">Solutions:</h3>
          {solutions.map((solution, idx) => (
            <div key={idx} className="mb-4">
              <h4 className="text-md font-medium text-black mb-1">
                Solution {idx + 1}:
              </h4>
              <SyntaxHighlighter language="cpp" style={solarizedlight} showLineNumbers>
                {solution}
              </SyntaxHighlighter>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Problem;
