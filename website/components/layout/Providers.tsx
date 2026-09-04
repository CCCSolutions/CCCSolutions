'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import { Toaster } from 'sonner';
import { SupabaseAuthProvider } from '../auth/SupabaseAuthProvider';
import { AuthHashErrorHandler } from '../auth/AuthHashErrorHandler';

// Sonner reads its own theme prop, so sync it to next-themes rather than letting
// it fall back to prefers-color-scheme (which ignores the in-app theme toggle).
function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      position="bottom-right"
      richColors
      closeButton
    />
  );
}

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
      <SupabaseAuthProvider>
        {children}
        <AuthHashErrorHandler />
        <ThemedToaster />
      </SupabaseAuthProvider>
    </NextThemesProvider>
  );
}
