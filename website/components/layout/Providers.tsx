'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { AuthProvider } from '../auth/AuthProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    // @ts-ignore - Property 'children' does not exist on type 'IntrinsicAttributes & ThemeProviderProps'
    <NextThemesProvider
      attribute="data-theme"
      themes={['light', 'dark']}
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>{children}</AuthProvider>
    </NextThemesProvider>
  );
}
