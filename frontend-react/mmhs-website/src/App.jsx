import React from "react";
import { BrowserRouter as Router, Route, Routes, useParams } from "react-router-dom";
import Problem from "./components/problem";
import Home from "./components/home";
import NotFound from "./components/notfound";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/contest/:contestYear/:problemCode" element={<ProblemWrapper />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

// Wrapper to pass URL params to the Problem component
const ProblemWrapper = () => {
  const { contestYear, problemCode } = useParams();
  return <Problem contestYear={contestYear} problemCode={problemCode} />;
};

export default App;
