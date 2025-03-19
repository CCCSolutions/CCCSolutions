// eslint-disable-next-line no-unused-vars
import React from "react";
import ProblemsTable from "../components/ProblemTable.jsx";
import SearchBar from "../components/Searchbar.jsx";
import { Helmet } from "react-helmet";
import { problems } from "../../constants.js";

const Solutions = () => {
  return (
    <div>
		<title>Solutions</title>
		<Helmet>
			<title>Curated CCC Solutions | Canadian Computing Competition</title>
			<meta name="keywords" content="
			CCC Solutions, Canadian Computing Competition Solutions, CCC Problem Solutions, CCC Past Problems, CCC Contest Solutions, University of Waterloo CCC, Competitive Programming, Algorithm Challenges, Data Structures, Problem Solving, Coding Solutions, Code Repository, Programming Contests, CCC Code Submissions, C++ CCC Solutions, Python CCC Solutions, Java CCC Solutions, CCC Preparation, CCC Strategies, Coding Contest Training, Problem-Solving Techniques, Coding Competitions
			" />
			<meta name="description" content="
			Explore curated solutions for past Canadian Computing Competition (CCC) problems. Browse through a comprehensive collection of CCC problem solutions in C++, Python, and Java. Enhance your competitive programming skills with structured solutions, problem analysis, and expert strategies.
			" />
			<meta name="author" content="MMHS" />
			<meta name="robots" content="index, follow" />
		</Helmet>

		<div className="bg-gradient-to-r from-blue-800 to-indigo-900 text-white py-16 px-4">
			<div className="container mx-auto text-center">
				<h1 className="text-5xl font-bold mb-4">Curated Solutions</h1>
				<p className="text-2xl">Find all solutions to past Canadian Computing Competition problems.</p>
				<div className="flex justify-center text-justify text-black">
				<SearchBar problems={problems} />
				</div>
			</div>
		</div>
		<ProblemsTable problems={problems} />
    </div>
  );
};

export default Solutions;