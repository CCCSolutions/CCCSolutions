'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { SunIcon } from '@radix-ui/react-icons';
import { Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <button
      type="button"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="inline-flex size-9 items-center justify-center text-foreground-light hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
    >
      {mounted ? (
        isDark ? <SunIcon width="18" height="18" /> : <Moon size={18} strokeWidth={1.75} />
      ) : (
        <span className="block h-[18px] w-[18px]" />
      )}
    </button>
  );
}
