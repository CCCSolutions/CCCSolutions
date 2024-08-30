import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-white p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <img src="https://cdn.discordapp.com/attachments/1174486466961866793/1279184503281287339/school_logo.png?ex=66d384e7&is=66d23367&hm=143e20e8b175b53c598e2781883b30c9312bca10a172eb4323acf115af770504&" alt="MMHS Logo" className="h-10 w-auto mr-3" />
          <span className="text-2xl font-semibold">MMHS</span>
        </div>
        <ul className="flex space-x-8 text-lg">
          <li><Link to="/" className="hover:text-blue-400 transition-colors duration-300">Home</Link></li>
          <li><Link to="/about" className="hover:text-blue-400 transition-colors duration-300">About</Link></li>
          <li><Link to="/problems" className="hover:text-blue-400 transition-colors duration-300">Problems</Link></li>
          <li><Link to="/forum" className="hover:text-blue-400 transition-colors duration-300">Forum</Link></li>
          <li><Link to="/resources" className="hover:text-blue-400 transition-colors duration-300">Resources</Link></li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
