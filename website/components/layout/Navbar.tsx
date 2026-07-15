'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { HamburgerMenuIcon, Cross1Icon, PersonIcon } from '@radix-ui/react-icons';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../auth/AuthProvider';

// Default avatar SVG (used when profile.avatarUrl is null)
const DEFAULT_AVATAR_SVG = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'><rect width='32' height='32' rx='16' fill='%23312e81'/><text x='50%25' y='54%25' dominant-baseline='middle' text-anchor='middle' font-size='14' fill='white' font-family='sans-serif'>?</text></svg>`;

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const { state, profile, logout } = useAuth();

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

  // Removed unnecessary console.log for auth state

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Solutions', path: '/solutions' },
    { name: 'Forum', path: '/forum' },
    { name: 'Resources', path: '/resources' },
  ];

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <nav className="bg-surface-100 border-b border-border-default">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center">
              <Image
                src="/images/mmhs_logo_transparent.png"
                alt="MMHS Logo"
                width={40}
                height={40}
                className="h-10 w-auto"
              />
            </Link>
            <ThemeToggle />
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-center gap-x-4">
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

              {/* Auth section */}
              {state === 'in' && profile ? (
                <div className="flex items-center gap-3 ml-2">
                  <div className="flex items-center gap-2">
                    <Image
                      src={profile.avatarUrl ?? DEFAULT_AVATAR_SVG}
                      alt={profile.username}
                      width={28}
                      height={28}
                      className="rounded-full object-cover border border-border-strong"
                      unoptimized
                    />
                    <span className="text-sm font-medium text-foreground-light leading-none">
                      {profile.username}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    title="Sign out"
                    className="cursor-pointer text-foreground-lighter hover:text-destructive transition-colors p-1.5 rounded-md hover:bg-surface-200"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 15 15"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4"
                    >
                      <path
                        d="M13.625 7.5C13.625 10.8827 10.8827 13.625 7.5 13.625C4.11726 13.625 1.375 10.8827 1.375 7.5C1.375 4.11726 4.11726 1.375 7.5 1.375C9.07342 1.375 10.5097 1.97011 11.595 2.94318L10.8037 3.82794C9.93297 3.03606 8.77259 2.55357 7.5 2.55357C4.76814 2.55357 2.55357 4.76814 2.55357 7.5C2.55357 10.2319 4.76814 12.4464 7.5 12.4464C10.2319 12.4464 12.4464 10.2319 12.4464 7.5C12.4464 6.84074 12.3174 6.21156 12.0836 5.63737L13.1784 4.88701C13.4682 5.69466 13.625 6.57868 13.625 7.5ZM13.8536 2.14645C14.0488 2.34171 14.0488 2.65829 13.8536 2.85355L8.85355 7.85355C8.65829 8.04882 8.34171 8.04882 8.14645 7.85355C7.95118 7.65829 7.95118 7.34171 8.14645 7.14645L13.1464 2.14645C13.3417 1.95118 13.6583 1.95118 13.8536 2.14645Z"
                        fill="currentColor"
                        fillRule="evenodd"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              ) : state === 'out' ? (
                <Link
                  href="/login"
                  title="Sign in"
                  className="cursor-pointer flex items-center justify-center w-8 h-8 rounded-full border border-border-strong text-foreground-lighter hover:text-brand hover:border-brand hover:bg-surface-200 transition-colors ml-2"
                >
                  <PersonIcon width="16" height="16" />
                </Link>
              ) : null}
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

      {/* Mobile menu */}
      {isMobile && (
        <div className={`md:hidden ${isOpen ? 'block' : 'hidden'}`}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.path}
                className={`
                  block w-fit px-3 py-2 rounded-md text-base font-normal
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
            {state === 'in' && profile ? (
              <div className="px-3 py-2 flex items-center gap-3 border-t border-border-default mt-2">
                <Image
                  src={profile.avatarUrl ?? DEFAULT_AVATAR_SVG}
                  alt={profile.username}
                  width={30}
                  height={30}
                  className="rounded-full object-cover border border-border-strong"
                  unoptimized
                />
                <div className="flex-grow">
                  <span className="block text-sm font-semibold text-foreground">{profile.username}</span>
                  <button
                    onClick={() => { handleLogout(); setIsOpen(false); }}
                    className="text-xs text-foreground-lighter hover:text-foreground underline"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            ) : state === 'out' ? (
              <div className="px-3 py-2 border-t border-border-default mt-2">
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex items-center gap-2 text-sm text-foreground-light hover:text-brand transition-colors"
                >
                  <div className="flex items-center justify-center w-7 h-7 rounded-full border border-border-strong text-foreground-lighter">
                    <PersonIcon width="14" height="14" />
                  </div>
                  <span>Sign in</span>
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
