import React from "react";
import { BrowserRouter as Router, Route, Routes, useParams } from "react-router-dom";

import Problem from "./components/Solution.jsx";
import Home from "./pages/HomePage.jsx";
import Problems from "./pages/ProblemsPage.jsx";
import NotFound from "./pages/NotfoundPage.jsx";
import Navbar from "./components/Navbar.jsx";
import FooterWithLogo from "./components/Footer.jsx";
import About from "./pages/AboutPage.jsx";
import ForumList from "./pages/ForumList.jsx";
import Forum from "./pages/Forum.jsx";
import Thread from "./pages/Thread.jsx";

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
            <Route path="/about" element = {<About />} />
            <Route path="/forum" element={<ForumList/>} />
            <Route path="/forum/:forumId" element={<ForumWrapper/>} />
            <Route path="/thread/:forumId" element={<ThreadWrapper/>} />
            <Route path="*" element={<NotFound />} />
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

const ForumWrapper = () => {
  const { forumId } = useParams();
  console.log("forumid 1 is ", forumId)
  return <Forum forumId={forumId}/>;
}

const ThreadWrapper = () => {
  const { forumId } = useParams();
  return <Thread forumId={forumId}/>;
}

export default App;
