import React from 'react';
import { Link } from 'react-router-dom';
import logoImage from '../assets/mmhs_logo.png';

const Navbar = () => {
  return (
    <nav className="bg-white p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <img
              src={logoImage}
              className="h-[52px] w-auto mr-3"
          /> <span className="text-xl font-medium">Milliken Mills High School</span>
        </div>
        <ul className="flex space-x-8 text-lg">
          <li><Link to="/" className="hover:text-blue-400 transition-colors duration-300">Home</Link></li>
          <li><Link to="/about" className="hover:text-blue-400 transition-colors duration-300">About</Link></li>
          <li><Link to="/solutions" className="hover:text-blue-400 transition-colors duration-300">Solutions</Link></li>
          <li><Link to="/forum" className="hover:text-blue-400 transition-colors duration-300">Forum</Link></li>
          <li><Link to="/resources" className="hover:text-blue-400 transition-colors duration-300">Resources</Link></li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
