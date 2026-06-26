'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HamburgerMenuIcon, Cross1Icon } from '@radix-ui/react-icons';
import Image from 'next/image';
import ThemeToggle from './ThemeToggle';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };

    handleResize();
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
    <nav className="bg-surface-100 border-b border-border-default">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <Link href="/website/public" className="flex items-center">
              <Image src="/images/mmhs_logo_transparent.png" alt="MMHS Logo" width={40} height={40} className="h-10 w-auto" />
            </Link>
            <ThemeToggle />
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline gap-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.path}
                  className={`
                    px-3 py-2 rounded-md text-lg font-normal
                    relative
                    ${
                      pathname === item.path
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-foreground-light hover:text-blue-600 dark:hover:text-blue-400'
                    }
                    transition-all duration-300
                    group
                  `}
                >
                  {item.name}
                  <span
                    className={`
                      absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400
                      transform origin-bottom scale-x-0 transition-transform duration-300 ease-out
                      ${pathname === item.path ? 'scale-x-100' : 'group-hover:scale-x-100'}
                    `}
                  ></span>
                </Link>
              ))}
            </div>
          </div>
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-foreground-light hover:text-blue-600 dark:hover:text-blue-400 hover:bg-surface-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <Cross1Icon width="24" height="24" aria-hidden="true" />
              ) : (
                <HamburgerMenuIcon width="24" height="24" aria-hidden="true" />
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
                href={item.path}
                className={`
                  block px-3 py-2 rounded-md text-base font-normal
                  relative overflow-hidden
                  ${
                    pathname === item.path
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-foreground-light hover:text-blue-600 dark:hover:text-blue-400'
                  }
                  transition-all duration-300
                `}
                onClick={() => setIsOpen(false)}
              >
                {item.name}
                <span
                  className={`
                    absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400
                    transform ${pathname === item.path ? 'translate-x-0' : '-translate-x-full'}
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
