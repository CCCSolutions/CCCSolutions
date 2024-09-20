import React, { useState, useEffect } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { solarizedlight } from "react-syntax-highlighter/dist/esm/styles/prism";

const Problem = ({ contestYear, problemCode }) => {
  const [solutions, setSolutions] = useState([]); // Store multiple solutions
  const [testCases, setTestCases] = useState([]);
  const [activeTab, setActiveTab] = useState(0); // To manage active test case tab
  const [actualProblemCode, setActualProblemCode] = useState(problemCode);

  useEffect(() => {
    const fetchSolutions = async () => {
      const alternativeCode = getAlternativeCode(problemCode);
      let foundCode = problemCode;
      const solutionsArray = [];

      for (const code of [problemCode, alternativeCode]) {
        if (!code) continue;
        const basePath = `/past_contests/${contestYear}/${code}`;

        for (let i = 1; i <= 5; i++) { // Fetch up to solution5.txt
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

    const fetchTestCases = async () => {
      const basePath = `/past_contests/${contestYear}/${problemCode}/test_data`;

      try {
        const inputs = await fetchTestFiles(basePath, ".in");
        const outputs = await fetchTestFiles(basePath, ".out");

        const matchedTestCases = inputs.map((inputFile, idx) => ({
          input: inputFile,
          output: outputs[idx] || "No matching output found",
        }));

        setTestCases(matchedTestCases);
      } catch (error) {
        console.error("Error fetching test cases:", error);
      }
    };

    const fetchTestFiles = async (basePath, extension) => {
      const testCases = [];
      for (let i = 1; i <= 30; i++) {
        const testCaseFile = `${basePath}/${problemCode}.${i}${extension}`;
        try {
          const response = await fetch(testCaseFile);
          if (response.ok) {
            const text = await response.text();
            testCases.push(text);
          }
        } catch (error) {
          console.error(`Error fetching test case: ${testCaseFile}`, error);
        }
      }
      return testCases;
    };

    fetchSolutions();
    fetchTestCases();
  }, [contestYear, problemCode]);

  const getAlternativeCode = (code) => {
    const mapping = {
      j5: "s3",
      j4: "s2",
      j3: "s1",
    };
    return mapping[code.toLowerCase()];
  };

  const isValidTestCase = (testCase) =>
      !testCase.toLowerCase().startsWith("<!doctype html>");

  return (
      <div className="w-full p-8 rounded-lg bg-white shadow-md">
        {testCases.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-black mb-4">Test Cases:</h3>
              <div className="bg-gray-100 p-4 rounded-lg w-1/2 mx-auto">
                <div className="flex space-x-2 mb-4 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400">
                  {testCases.map((_, idx) => (
                      <button
                          key={idx}
                          onClick={() => setActiveTab(idx)}
                          className={`px-4 py-2 flex-shrink-0 ${
                              activeTab === idx
                                  ? "bg-blue-800 text-white"
                                  : "bg-gray-200 text-black"
                          } rounded-lg`}
                      >
                        Case {idx + 1}
                      </button>
                  ))}
                </div>

                <div className="p-4 bg-white rounded-lg">
                  {isValidTestCase(testCases[activeTab].input) &&
                  isValidTestCase(testCases[activeTab].output) ? (
                      <>
                        <p className="text-black mb-2">
                          <strong>Input:</strong>
                        </p>
                        <textarea
                            className="w-full h-20 p-2 mb-4 bg-gray-100 text-black border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                            readOnly
                            value={testCases[activeTab].input}
                        />
                        <p className="text-black mb-2">
                          <strong>Output:</strong>
                        </p>
                        <textarea
                            className="w-full h-20 p-2 bg-gray-100 text-black border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                            readOnly
                            value={testCases[activeTab].output}
                        />
                      </>
                  ) : (
                      <p className="text-red-600 font-bold text-center">
                        Test Case Not Available. If You Have Test Cases, Upload Them On The Forum
                      </p>
                  )}
                </div>
              </div>
            </div>
        )}

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
  );
};
export default Problem;
