'use client';

// FIXME: built for the /forum/preview mockup routes only — reads the same
// PocketBase session as Login.tsx, but isn't wired into the real forum yet.

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import PocketBase from 'pocketbase';

const pb = new PocketBase('https://mmhs.pockethost.io');

export type User = {
  id: string;
  username: string;
  rep: number;
};

export type AuthState = 'pending' | 'in' | 'out';

type AuthContextValue = {
  state: AuthState;
  user: User | null;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue>({
  state: 'pending',
  user: null,
  logout: () => {},
});

function readUser(): User | null {
  if (!pb.authStore.isValid) return null;
  const m = pb.authStore.model;
  if (!m) return null;
  return {
    id: m.id,
    username: (m.username as string) || 'user',
    rep: typeof m.rep === 'number' ? m.rep : 0,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>('pending');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const sync = () => {
      const u = readUser();
      setUser(u);
      setState(u ? 'in' : 'out');
    };
    sync();
    return pb.authStore.onChange(sync);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      state,
      user,
      logout: () => pb.authStore.clear(),
    }),
    [state, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
