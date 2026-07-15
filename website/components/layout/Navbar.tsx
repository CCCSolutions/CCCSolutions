'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { HamburgerMenuIcon, Cross1Icon, PersonIcon, CheckIcon, Cross2Icon } from '@radix-ui/react-icons';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../auth/AuthProvider';
import { apiFetch } from '../../lib/supabase';

const DEFAULT_AVATAR_SVG = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'><rect width='32' height='32' rx='16' fill='%23312e81'/><text x='50%' y='54%' dominant-baseline='middle' text-anchor='middle' font-size='14' fill='white' font-family='sans-serif'>?</text></svg>`;

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [usernameLoading, setUsernameLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const { state, profile, logout, refreshProfile } = useAuth();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) setIsOpen(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setEditingUsername(false);
        setUsernameError('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Solutions', path: '/solutions' },
    { name: 'Forum', path: '/forum' },
    { name: 'Resources', path: '/resources' },
  ];

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    router.push('/');
  };

  const handleSaveUsername = async () => {
    if (!usernameInput.trim()) return;
    setUsernameError('');
    setUsernameLoading(true);
    const res = await apiFetch('/user/me/username', {
      method: 'PATCH',
      body: JSON.stringify({ username: usernameInput.trim() }),
    });
    setUsernameLoading(false);
    if (res.ok) {
      await refreshProfile();
      setEditingUsername(false);
      setUsernameInput('');
    } else {
      const body = await res.json().catch(() => ({})) as { error?: string };
      setUsernameError(body.error ?? 'Failed to update username.');
    }
  };

  const openEditUsername = () => {
    setUsernameInput(profile?.username ?? '');
    setUsernameError('');
    setEditingUsername(true);
  };

  // Desktop profile dropdown
  const ProfileDropdown = () => (
    <div className="relative" ref={dropdownRef}>
      <button
        id="profile-menu-btn"
        onClick={() => { setDropdownOpen((v) => !v); setEditingUsername(false); setUsernameError(''); }}
        className="flex items-center gap-2 cursor-pointer rounded-full p-0.5 hover:ring-2 hover:ring-brand/40 transition-all"
        aria-label="Profile menu"
      >
        <Image
          src={profile?.avatarUrl ?? DEFAULT_AVATAR_SVG}
          alt={profile?.username ?? 'Profile'}
          width={30}
          height={30}
          className="rounded-full object-cover border border-border-strong"
          unoptimized
        />
        <HamburgerMenuIcon width={14} height={14} className="text-foreground-lighter" />
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-60 rounded-lg border border-border-default bg-surface-100 shadow-lg z-50 overflow-hidden">
          {/* User info header */}
          <div className="px-4 py-3 border-b border-border-default">
            <p className="text-xs text-foreground-lighter mb-0.5">Signed in as</p>
            <div className="flex items-center gap-1.5 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{profile?.username}</p>
              {profile?.role === 'admin' && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-xs text-[10px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 shrink-0">
                  Admin
                </span>
              )}
              {profile?.role === 'moderator' && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-xs text-[10px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 shrink-0">
                  Moderator
                </span>
              )}
            </div>
          </div>

          {/* Edit username */}
          <div className="px-4 py-2.5 border-b border-border-default">
            {!editingUsername ? (
              <button
                id="edit-username-btn"
                onClick={openEditUsername}
                className="w-full text-left text-sm text-foreground-light hover:text-foreground transition-colors"
              >
                ✏️ Edit username
              </button>
            ) : (
              <div className="space-y-2">
                <input
                  id="username-input"
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveUsername(); if (e.key === 'Escape') { setEditingUsername(false); setUsernameError(''); } }}
                  className="w-full px-2.5 py-1.5 text-sm rounded border border-border-strong bg-background text-foreground placeholder:text-foreground-lighter focus:outline-none focus:border-brand-highlight"
                  placeholder="New username"
                  autoFocus
                />
                {usernameError && <p className="text-xs text-destructive">{usernameError}</p>}
                <div className="flex gap-1.5">
                  <button
                    id="save-username-btn"
                    onClick={handleSaveUsername}
                    disabled={usernameLoading}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-brand text-white hover:bg-brand/90 disabled:opacity-50 transition-colors"
                  >
                    <CheckIcon width={10} height={10} />
                    {usernameLoading ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    onClick={() => { setEditingUsername(false); setUsernameError(''); }}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs rounded border border-border-strong text-foreground-light hover:text-foreground transition-colors"
                  >
                    <Cross2Icon width={10} height={10} />
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sign out */}
          <div className="px-4 py-2.5">
            <button
              id="signout-btn"
              onClick={handleLogout}
              className="w-full text-left text-sm text-foreground-light hover:text-destructive transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );

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
                <div className="ml-2">
                  <ProfileDropdown />
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
              <div className="px-3 py-3 border-t border-border-default mt-2 space-y-3">
                <div className="flex items-center gap-3">
                  <Image
                    src={profile.avatarUrl ?? DEFAULT_AVATAR_SVG}
                    alt={profile.username}
                    width={30}
                    height={30}
                    className="rounded-full object-cover border border-border-strong"
                    unoptimized
                  />
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">{profile.username}</span>
                    {profile.role === 'admin' && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-xs text-[10px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        Admin
                      </span>
                    )}
                    {profile.role === 'moderator' && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-xs text-[10px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        Moderator
                      </span>
                    )}
                  </div>
                </div>
                {/* Mobile edit username */}
                {editingUsername ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-sm rounded border border-border-strong bg-background text-foreground focus:outline-none focus:border-brand-highlight"
                      placeholder="New username"
                      autoFocus
                    />
                    {usernameError && <p className="text-xs text-destructive">{usernameError}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveUsername}
                        disabled={usernameLoading}
                        className="px-3 py-1 text-xs rounded bg-brand text-white hover:bg-brand/90 disabled:opacity-50"
                      >
                        {usernameLoading ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        onClick={() => { setEditingUsername(false); setUsernameError(''); }}
                        className="px-3 py-1 text-xs rounded border border-border-strong text-foreground-light"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={openEditUsername}
                    className="text-sm text-foreground-light hover:text-foreground transition-colors"
                  >
                    ✏️ Edit username
                  </button>
                )}
                <button
                  onClick={() => { handleLogout(); setIsOpen(false); }}
                  className="block text-sm text-foreground-lighter hover:text-destructive transition-colors"
                >
                  Sign out
                </button>
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
