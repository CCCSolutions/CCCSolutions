import React, { useState, useEffect } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { solarizedlight } from "react-syntax-highlighter/dist/esm/styles/prism";

const Problem = ({ contestYear, problemCode }) => {
  const [solution, setSolution] = useState("Loading...");

  useEffect(() => {
    const basePath = `/past_contests/${contestYear}/${problemCode}`;

    fetch(`${basePath}/solution.txt`)
      .then((response) => response.text())
      .then((text) => {
        if (text.toLowerCase().includes('<!doctype html>')) {
          setSolution("Solution does not currently exist.");
        } else {
          setSolution(text);
        }
      })
      .catch(() => setSolution("Solution does not currently exist."));
  }, [contestYear, problemCode]);

  return (
    <div className="w-full p-8 rounded-lg">

      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        {`CCC ${contestYear} ${problemCode.toUpperCase()}`}
      </h2>

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
