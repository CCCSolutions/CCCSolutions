import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { TeamOutlined, FileTextOutlined, GithubOutlined } from '@ant-design/icons';

// Styled components
const IconWrapper = styled.div`
    font-size: 2rem;
    margin-right: 20px;
    border-radius: 12px;
    background: ${props => props.background || 'linear-gradient(135deg, #8a59fa, #7f73ff, #786cae, #8a59fa)'};
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 58px;
    height: 58px;
    flex-shrink: 0;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const TeamIconWrapper = styled(IconWrapper)`
    background: linear-gradient(135deg, #4E54C8, #8F94FB);
`;

const FileTextIconWrapper = styled(IconWrapper)`
    background: linear-gradient(135deg, #11998E, #38EF7D);
`;

const GithubIconWrapper = styled(IconWrapper)`
  background: linear-gradient(135deg, #333, #666);
  transition: background 0.5s ease, transform 0.3s ease;  

  &:hover {
    background: linear-gradient(135deg, #42A5F5, #1E88E5); 
    transform: scale(1.03); 
    z-index: 1;  
  }
`;




const Home = () => {
  const contentRef = useRef(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((prevCount) => (prevCount < 1000 ? prevCount + 10 : 1000));
    }, 20);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-100">
      {/* Hero Section */}
      <div
          className="relative bg-gradient-to-r from-blue-800 to-indigo-900 text-white min-h-screen flex flex-col justify-center items-center text-center px-4"
      >
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          <span className="text-blue-400 tabular-nums">{count.toLocaleString()}</span>+ Students Helped with CCC
          Solutions
        </h1>
        <p className="text-xl md:text-2xl max-w-2xl mb-10">
          The <strong>most comprehensive solution repository</strong> for the Canadian Computing Competition.
        </p>
        <div className="flex space-x-4">
          <Link
              to="/solutions"
              className="bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition transform duration-300 hover:scale-102 hover:shadow-md"
          >
            Explore Solutions
          </Link>
          <Link
              to="/forum"
              className="bg-gradient-to-r from-white to-gray-100 text-blue-900 font-bold py-3 px-6 rounded-lg transition transform duration-300 hover:scale-102 hover:shadow-md"
          >
            Visit Forum
          </Link>
        </div>
      </div>

      {/* Content Section */}
      <div ref={contentRef} className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">
            Find CCC solutions{' '}
            <span className="bg-gradient-to-r from-yellow-400 to-amber-400 px-2 py-1 rounded">
              From 1996 To Present
            </span>
          </h2>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-10">
            {[
              {
                title: 'Interactive Forum',
                content: 'Discuss with peers through the forum to tackle challenging CCC problems and improve your skills.',
                icon: <TeamIconWrapper><TeamOutlined/></TeamIconWrapper>,
              },
              {
                title: 'Comprehensive Solutions',
                content: 'Access detailed explanations, test files, and multiple approaches to solve CCC problems dating back to 1996.',
                icon: <FileTextIconWrapper><FileTextOutlined/></FileTextIconWrapper>,
              },
              {
                title: 'Open Source',
                content: 'Check out our GitHub repository. Contribute, suggest improvements, or learn from the codebase.',
                icon: <a href="https://github.com/Tankman61/mmhs-website" target="_blank" rel="noopener noreferrer">
                  <GithubIconWrapper><GithubOutlined/></GithubIconWrapper>
                </a>,
              },
            ].map((feature, index) => (
                <div key={index} className="relative group">
                  <div
                      className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-800 rounded-xl blur opacity-45 group-hover:opacity-90 transition duration-1000"
                  ></div>
                  <div
                      className="relative bg-white/95 backdrop-blur-sm rounded-xl p-6 flex flex-col items-start space-y-4 h-full transform transition duration-300 hover:scale-102 hover:shadow-md"
                  >
                    {feature.icon}
                    <div>
                      <h3 className="text-xl font-semibold mb-2 bg-clip-text text-transparent bg-blue-800">
                        {feature.title}
                      </h3>
                      <p className="text-gray-700">{feature.content}</p>
                    </div>
                  </div>
                </div>
            ))}
          </div>

          {/* Statistics */}
          <div className="relative group">
            <div
                className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-800 rounded-xl blur opacity-45 group-hover:opacity-90 transition duration-1000"
            ></div>
            <div
                className="relative bg-white/95 backdrop-blur-sm rounded-xl p-4 flex justify-around transform transition duration-300 hover:scale-102 hover:shadow-md"
            >
              <div className="grid md:grid-cols-3 gap-16">
                <div className="text-center p-3">
                  <p className="text-4xl font-bold text-blue-800">N/A</p>
                  <p className="text-gray-600">Forum Users</p>
                </div>
                <div className="text-center p-3">
                  <p className="text-4xl font-bold text-blue-800">200+</p>
                  <p className="text-gray-600">CCC Solutions</p>
                </div>
                <div className="text-center p-3">
                  <p className="text-4xl font-bold text-blue-800">23 years</p>
                  <p className="text-gray-600">Providing Answers</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;