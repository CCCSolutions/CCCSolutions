'use client';

import React, { Suspense } from "react";
import ProblemsTable from "../../components/ProblemTable";
import SearchBar from "../../components/Searchbar";
import { problems } from "../../constants";


function SolutionsContent() {
  return (
    <div>
      <div className="bg-linear-to-r from-blue-800 to-indigo-900 text-white py-16 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4">Curated Solutions</h1>
          <p className="text-2xl">Find all solutions to past Canadian Computing Competition problems.</p>
          <div className="flex justify-center text-justify text-black">
            <SearchBar problems={problems} />
          </div>
        </div>
      </div>
      <ProblemsTable />
    </div>
  );
}

export default function Solutions() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SolutionsContent />
    </Suspense>
  );
}
