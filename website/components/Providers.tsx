'use client';

import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import { Theme } from '@radix-ui/themes';
import { useEffect, useState } from 'react';

function RadixThemeBridge({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const appearance = mounted ? (resolvedTheme === 'dark' ? 'dark' : 'light') : 'light';

  return (
    <Theme appearance={appearance} accentColor="indigo" grayColor="slate" radius="medium" scaling="100%">
      {children}
    </Theme>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      themes={['light', 'dark']}
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <RadixThemeBridge>{children}</RadixThemeBridge>
    </NextThemesProvider>
  );
}
