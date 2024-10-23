import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import logoImage from '../assets/mmhs_logo.png';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Solutions', path: '/solutions' },
    { name: 'Forum', path: '/forum' },
    { name: 'Resources', path: '/resources' },
  ];

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="https://mmhs.ca" className="flex items-center">
            <img src={logoImage} alt="MMHS Logo" className="h-10 w-auto mr-3" />
            <span className="text-xl font-medium text-gray-900">Milliken Mills High School</span>
          </Link>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`
                    px-3 py-2 rounded-md text-lg font-medium
                    relative
                    ${
                      location.pathname === item.path
                        ? 'text-blue-600'
                        : 'text-gray-700 hover:text-blue-600'
                    }
                    transition-all duration-300
                    group
                  `}
                >
                  {item.name}
                  <span
                    className={`
                      absolute bottom-0 left-0 w-full h-0.5 bg-blue-600
                      transform origin-bottom scale-x-0 transition-transform duration-300 ease-out
                      ${location.pathname === item.path ? 'scale-x-100' : 'group-hover:scale-x-100'}
                    `}
                  ></span>
                </Link>
              ))}
            </div>
          </div>
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      {isMobile && (
        <div className={`md:hidden ${isOpen ? 'block' : 'hidden'}`}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`
                  block px-3 py-2 rounded-md text-base font-medium
                  relative overflow-hidden
                  ${
                    location.pathname === item.path
                      ? 'text-blue-600'
                      : 'text-gray-700 hover:text-blue-600'
                  }
                  transition-all duration-300
                `}
                onClick={() => setIsOpen(false)}
              >
                {item.name}
                <span
                  className={`
                    absolute bottom-0 left-0 w-full h-0.5 bg-blue-600
                    transform ${location.pathname === item.path ? 'translate-x-0' : '-translate-x-full'}
                    transition-transform duration-300 ease-out
                  `}
                ></span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
