// eslint-disable-next-line no-unused-vars
import React from "react";
import ProblemsTable from "../components/ProblemTable.jsx";
import SearchBar from "../components/Searchbar.jsx";
import { Helmet } from "react-helmet";
import { problems } from "../../constants.js";

const Solutions = () => {
  return (
    <div>
		<Helmet>
			<title>All CCC Solutions (1996-2025) | Browse 270+ Canadian Computing Competition Problems</title>
			<meta name="description" content="Browse 270+ Canadian Computing Competition solutions from 1996-2025. Filter by year, difficulty (Easy to Wicked), or topic (graph theory, DP, greedy). Solutions in C++, Python & Java with test cases." />
			<meta name="keywords" content="CCC solutions, Canadian Computing Competition problems, CCC all years, CCC 1996-2025, CCC past contests, CCC problem list, graph theory CCC, dynamic programming CCC, CCC difficulty, CCC Junior problems, CCC Senior problems, competitive programming solutions" />
			<meta name="author" content="CCCSolutions Community" />
			<meta name="robots" content="index, follow, max-image-preview:large" />
			<link rel="canonical" href="https://cccsolutions.ca/solutions" />
			<meta property="og:title" content="All CCC Solutions (1996-2025) | 270+ Problems" />
			<meta property="og:description" content="Browse all Canadian Computing Competition solutions. Filter by year, difficulty, or algorithm topic." />
			<meta property="og:url" content="https://cccsolutions.ca/solutions" />
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