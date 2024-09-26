import React from "react";
import { BrowserRouter as Router, Route, Routes, useParams } from "react-router-dom";

import Problem from "./components/Solution.jsx";
import Home from "./pages/HomePage.jsx";
import Solutions from "./pages/ProblemsPage.jsx";
import NotFound from "./pages/NotfoundPage.jsx";
import Navbar from "./components/Navbar.jsx";
import FooterWithLogo from "./components/Footer.jsx";
import About from "./pages/AboutPage.jsx";
import Forum from "./pages/ForumsPage.jsx";
import PostPage from "./pages/PostPage.jsx";
import CreatePost from "./pages/CreatePostPage.jsx";
import Resources from "./pages/ResourcesPage.jsx";

const App = () => {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/solutions" element={<Solutions />} />
            <Route path="/contest/:contestYear/:problemCode" element={<ProblemWrapper />} />
            <Route path="/about" element = {<About />} />
            <Route path="/resources" element = {<Resources />} />
            <Route path="/forum" element={<Forum/>} />
            <Route path="/forum/:id" element={<PostPage />} />
            <Route path="/create-post" element={<CreatePost />} />
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
  return <Forum forumId={forumId}/>;
}

const ThreadWrapper = () => {
  const { forumId } = useParams();
  return <Thread forumId={forumId}/>;
}

export default App;