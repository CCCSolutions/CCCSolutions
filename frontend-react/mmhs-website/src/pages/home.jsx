import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  const contentRef = useRef(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((prevCount) => (prevCount < 10000 ? prevCount + 100 : 10000));
    }, 20);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white min-h-screen flex flex-col justify-center items-center text-center px-4">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          <span className="text-blue-300 tabular-nums">{count.toLocaleString()}</span>+ Students Helped with CCC Solutions
        </h1>
        <p className="text-xl md:text-2xl max-w-2xl mb-10">
          Empowering students with <strong>comprehensive solutions</strong> for the Canadian Computing Competition.
        </p>
        <div className="flex space-x-4">
          <Link to="/problems" className="bg-blue-500 text-white font-bold py-3 px-6 rounded-lg">
            Explore Problems
          </Link>
          <Link to="/forum" className="bg-white text-blue-900 font-bold py-3 px-6 rounded-lg">
            Visit Forum
          </Link>
        </div>
      </div>

      {/* Content Section */}
      <div ref={contentRef} className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">
            Find all CCC solutions <span className="bg-yellow-300 px-2 py-1 rounded"> Since 1996, Completely Free</span>
          </h2>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-2 gap-8 mb-20">
            {[
              {
                title: "Personalized Learning",
                content: "Our adaptive algorithms tailor questions to your skill level, ensuring efficient progress.",
              },
              {
                title: "Collaborative Problem Solving",
                content: "Work together with peers to tackle challenging CCC problems and improve your skills.",
              },
              {
                title: "Comprehensive Solutions",
                content: (
                  <p>
                    Access detailed explanations, test files, and multiple approaches to solve CCC problems. Solutions date back to <strong>1996, which no other platform offers.</strong>
                  </p>
                ),
              },
              {
                title: "Interactive Challenges",
                content: "Engage in fun, competitive coding challenges to boost your motivation and skills.",
              },
            ].map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-lg flex items-start space-x-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p>{feature.content}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Statistics */}
          <div className="bg-white p-8 rounded-lg shadow-lg mb-20">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <p className="text-4xl font-bold text-blue-600">98%</p>
                <p className="text-gray-600">Success Rate</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-green-600">500+</p>
                <p className="text-gray-600">CCC Problems Solved</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-purple-600">10,000+</p>
                <p className="text-gray-600">Students Helped</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
