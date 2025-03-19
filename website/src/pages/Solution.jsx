import React, { useState, useEffect } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { solarizedlight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Helmet } from "react-helmet";
import { Info, Code, FileText } from "lucide-react";
import { problems } from "../../constants";

const Problem = ({ contestYear, problemCode }) => {
  const [solutions, setSolutions] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [testCaseData, setTestCaseData] = useState({ input: "", output: "" });
  const [problemInfo, setProblemInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch problem info from the problems table
  useEffect(() => {
    const fetchProblemInfo = async () => {
      try {
        // First try to find exact match
        let problemData = problems.find(p => 
          p.link === `/contest/${contestYear}/${problemCode}`
        );
        setProblemInfo(problemData);

      } catch (error) {
        console.error("Error fetching problem info:", error);
        // Fallback title
        setProblemInfo({
          name: `${contestYear} ${problemCode.toUpperCase()}`,
          difficulty: 'Unknown',
          tags: []
        });
      }
    };
    
    fetchProblemInfo();
  }, [contestYear, problemCode]);

  // Fetch solutions
  useEffect(() => {
    const fetchSolutions = async () => {
      setLoading(true);
      const solutionsArray = [];
      const basePath = `/past_contests/${contestYear}/${problemCode}`;

      for (let i = 1; i <= 3; i++) {
        try {
          const fetchUrl = `${basePath}/solution${i === 1 ? "" : i}.txt`;
          const response = await fetch(fetchUrl);

          if (!response.ok) {
            continue;
          }

          const text = await response.text();
          
          if (!text.toLowerCase().includes("<!doctype html>")) {
            solutionsArray.push(text);
          }
        } catch (error) {
          console.error(`Error fetching solution${i}:`, error);
        }
      }

      if (solutionsArray.length > 0) {
        setSolutions(solutionsArray);
      } else {
        setSolutions([
          "Solution does not currently exist. If you have a solution, please upload your solution along with a commented explanation on our forum. Thank you!",
        ]);
      }
      setLoading(false);
    };

    fetchSolutions();
  }, [contestYear, problemCode]);

  // Set document title
  useEffect(() => {
    if (problemInfo) {
      document.title = problemInfo.name;
      return () => {
        document.title = "CCCSolutions";
      };
    }
  }, [problemInfo]);

  const fetchTestCase = async (idx) => {
    setTestCaseData({ input: "Loading...", output: "Loading..." });
    const basePath = `/past_contests/${contestYear}/${problemCode}/test_data`;

    try {
      const inputResponse = await fetch(`${basePath}/${problemCode}.${idx + 1}.in`);
      const outputResponse = await fetch(`${basePath}/${problemCode}.${idx + 1}.out`);

      const inputText = inputResponse.ok ? await inputResponse.text() : "No input found";
      const outputText = outputResponse.ok ? await outputResponse.text() : "No output found";

      setTestCaseData({ input: inputText, output: outputText });
    } catch (error) {
      console.error(`Error fetching test case ${idx + 1}:`, error);
      setTestCaseData({ input: "Error loading input", output: "Error loading output" });
    }
  };

  const handleTabClick = (idx) => {
    setActiveTab(idx);
    fetchTestCase(idx);
  };

  const isValidTestCase = (testCase) =>
    testCase && !testCase.toLowerCase().startsWith("<!doctype html>") && testCase !== "Loading...";

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
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

  const getLanguageFromCode = (code) => {
    // Detect language from code content
    if (code.includes("import java.") || code.includes("public class")) return "java";
    if (code.includes("#include <iostream>") || code.includes("using namespace std;")) return "cpp";
    if (code.includes("def ") || code.includes("input()") && !code.includes("import java.")) return "python";
    // Default to cpp as most solutions are in C++
    return "cpp";
  };

  // Generate SEO keywords
  const keywords = problemInfo ? 
    `${problemInfo.name}, CCC ${contestYear} ${problemCode}, ${problemInfo.tags.join(', ')}, Solution` :
    `CCC ${contestYear} ${problemCode.toUpperCase()} Solution`;

  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>{problemInfo?.name || `Solution: CCC ${contestYear} ${problemCode.toUpperCase()}`}</title>
        <meta name="keywords" content={keywords} />
        <meta property="og:title" content={problemInfo?.name || `Solution: CCC ${contestYear} ${problemCode.toUpperCase()}`} />
        <meta property="og:description" content="The most comprehensive solution repository for the Canadian Computing Competition, with solutions to the CCC from 1996 to present." />
        <meta property="og:url" content={window.location.href} />
        <meta name="theme-color" content="#1e3a8a" />
      </Helmet>

      <div className="mx-auto">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
          {/* Problem Header */}
          <div className="p-6">
            <h1 className="text-2xl font-bold">
              {problemInfo?.name || `CCC ${contestYear} ${problemCode.toUpperCase()}`}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {problemInfo?.difficulty && (
                <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium ${getDifficultyColor(problemInfo.difficulty)}`}>
                  {problemInfo.difficulty}
                </span>
              )}
              {problemInfo?.tags?.map((tag, idx) => (
                <span key={idx} className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Solutions Section */}
          <div className="p-6">
            <div className="flex items-center mb-4">
              <Code className="mr-2 h-5 w-5 text-blue-800" />
              <h2 className="text-xl font-semibold text-gray-900">
                {loading ? "Loading Solutions..." : `${solutions.length} Solution${solutions.length !== 1 ? 's' : ''} Available`}
              </h2>
            </div>

            {loading ? (
              <div className="animate-pulse flex space-x-4">
                <div className="flex-1 space-y-6 py-1">
                  <div className="h-64 bg-gray-200 rounded"></div>
                </div>
              </div>
            ) : (
              solutions.map((solution, idx) => (
                <div key={idx} className="mb-6 border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-100 px-4 py-2 flex justify-between items-center">
                    <h3 className="font-medium text-gray-700">Solution {idx + 1}</h3>
                    <span className="text-xs font-medium text-gray-500">
                      {getLanguageFromCode(solution).toUpperCase()}
                    </span>
                  </div>
                  <SyntaxHighlighter 
                    language={getLanguageFromCode(solution)} 
                    style={solarizedlight} 
                    showLineNumbers
                    customStyle={{ margin: 0, borderRadius: 0 }}
                  >
                    {solution}
                  </SyntaxHighlighter>
                </div>
              ))
            )}
          </div>

          {/* Test Cases Section */}
          <div className="border-t border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <FileText className="mr-2 h-5 w-5 text-blue-800" />
              <h2 className="text-xl font-semibold text-gray-900">Test Cases</h2>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="flex items-center p-4 border-b border-gray-200 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
                {Array.from({ length: 10 }, (_, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleTabClick(idx)}
                    className={`px-3 py-1 mr-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === idx 
                      ? "bg-blue-600 text-white" 
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Case {idx + 1}
                  </button>
                ))}
              </div>
              
              <div className="p-4">
                {activeTab === null ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Select a test case to view input and output</p>
                  </div>
                ) : isValidTestCase(testCaseData.input) && isValidTestCase(testCaseData.output) ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium text-gray-700 mb-2">Input:</h3>
                      <textarea
                        className="w-full h-48 p-3 bg-gray-50 text-gray-800 border border-gray-300 rounded-md resize-y font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        readOnly
                        value={testCaseData.input}
                      />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-700 mb-2">Output:</h3>
                      <textarea
                        className="w-full h-48 p-3 bg-gray-50 text-gray-800 border border-gray-300 rounded-md resize-y font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        readOnly
                        value={testCaseData.output}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8 text-red-600">
                    <Info className="mr-2 h-5 w-5" />
                    <p className="font-medium">Test case irretrievable. See GitHub repo for test data.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Problem;