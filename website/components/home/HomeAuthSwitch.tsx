'use client';

import React from 'react';
import { useAuth } from '../auth/AuthProvider';

export function HomeAuthSwitch({
  loggedOut,
  loggedIn,
}: {
  loggedOut: React.ReactNode;
  loggedIn: React.ReactNode;
}) {
  const { state } = useAuth();

  // Brief skeleton on first paint so logged-in users don't flash the marketing page.
  if (state === 'pending') {
    return <div aria-hidden className="min-h-[calc(100svh-var(--nav-h))] bg-background" />;
  }

  return <>{state === 'in' ? loggedIn : loggedOut}</>;
}
