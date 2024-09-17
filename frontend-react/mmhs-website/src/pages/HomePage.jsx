import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import BackgroundImage from '../assets/mmhs.jpg';
import { TeamOutlined, FileTextOutlined } from '@ant-design/icons';

// I just used the iconwrapper code from another project so it ain't tailwind
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
      <div
        className="relative bg-cover bg-center text-white min-h-screen flex flex-col justify-center items-center text-center px-4"
        style={{ backgroundImage: `url(${BackgroundImage})` }}
      >
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          <span className="text-blue-500 tabular-nums">{count.toLocaleString()}</span>+ Students Helped with CCC Solutions
        </h1>
        <p className="text-xl md:text-2xl max-w-2xl mb-10">
          Empowering students with <strong>comprehensive solutions</strong> for the Canadian Computing Competition.
        </p>
        <div className="flex space-x-4">
          <Link to="/problems" className="bg-blue-800 text-white font-bold py-3 px-6 rounded-lg">
            Explore Solutions
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
            Find all CCC solutions <span className="bg-blue-300 px-2 py-1 rounded"> Since 1996, Completely Free</span>
          </h2>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-2 gap-8 mb-20 ms-2">
            {[
              {
                title: 'Interactive Forum',
                content: 'Discuss with peers through the forum to tackle challenging CCC problems and improve your skills.',
                icon: <TeamIconWrapper><TeamOutlined /></TeamIconWrapper>,
              },
              {
                title: 'Comprehensive Solutions',
                content: (
                  <p>
                    Access detailed explanations, test files, and multiple approaches to solve CCC problems dating back to 1996.
                  </p>
                ),
                icon: <FileTextIconWrapper><FileTextOutlined /></FileTextIconWrapper>,
              },
            ].map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-lg flex items-start space-x-4">
                {feature.icon}
                <div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p>{feature.content}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Statistics */}
          <div className="bg-white p-8 rounded-lg shadow-lg mb-16">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <p className="text-4xl font-bold text-blue-800">N/A</p>
                <p className="text-gray-600">Forum Users</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-blue-800">200+</p>
                <p className="text-gray-600">CCC Solutions</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-blue-800">10,000+</p>
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
