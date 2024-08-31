import React from "react";
import { BrowserRouter as Router, Route, Routes, useParams } from "react-router-dom";
import Problem from "./components/problem";
import Home from "./pages/home.jsx";
import Problems from "./pages/problems.jsx";
import NotFound from "./components/notfound";
import Navbar from "./components/navbar";
import FooterWithLogo from "./components/footer";
import About from "./pages/about.jsx"

const App = () => {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/problems" element={<Problems />} />
            <Route path="/contest/:contestYear/:problemCode" element={<ProblemWrapper />} />
            <Route path="*" element={<NotFound />} />
            <Route path="/about" element = {<About />} />
          </Routes>
        </main>
        <FooterWithLogo />
      </div>
    </Router>
  );
};

// Wrapper to pass URL params to the Problem component
const ProblemWrapper = () => {
  const { contestYear, problemCode } = useParams();
  return <Problem contestYear={contestYear} problemCode={problemCode} />;
};

export default App;