'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, apiFetch } from '../../lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

// Shape of a profile row as returned by GET /user/me
export type Profile = {
  id: string;
  authUserId: string;
  username: string;
  avatarUrl: string | null;
  role: string;
  createdAt: string;
};

export type AuthState = 'pending' | 'in' | 'out';

type AuthContextValue = {
  state: AuthState;
  session: Session | null;
  profile: Profile | null;
  logout: () => Promise<void>;
  /** True when the user is logged in but still has a placeholder username */
  needsOnboarding: boolean;
  /** Reload profile from the API (call after username/avatar updates) */
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  state: 'pending',
  session: null,
  profile: null,
  logout: async () => {},
  needsOnboarding: false,
  refreshProfile: async () => {},
});

const PLACEHOLDER_RE = /^user_\d+$/;

async function fetchProfile(): Promise<Profile | null> {
  try {
    const res = await apiFetch('/user/me');
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>('pending');
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const router = useRouter();

  const loadProfile = async () => {
    const p = await fetchProfile();
    setProfile(p);
    return p;
  };

  useEffect(() => {
    // Bootstrap: get the current session synchronously from local storage.
    supabase.auth.getSession().then(async ({ data }) => {
      const s = data.session ?? null;
      setSession(s);
      if (s) {
        const p = await loadProfile();
        setState(p ? 'in' : 'out');
      } else {
        setState('out');
      }
    });

    // Subscribe to auth state changes (login, logout, token refresh).
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, s) => {
      setSession(s);
      if (s) {
        const p = await loadProfile();
        setState(p ? 'in' : 'out');
        // After a fresh OAuth sign-in, check whether the user needs onboarding.
        if (event === 'SIGNED_IN') {
          if (p && PLACEHOLDER_RE.test(p.username)) {
            router.push('/onboarding');
          }
        }
      } else {
        setProfile(null);
        setState('out');
      }
    });

    return () => listener.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    await loadProfile();
  };

  const needsOnboarding = !!(profile && PLACEHOLDER_RE.test(profile.username));

  const value = useMemo<AuthContextValue>(
    () => ({ state, session, profile, logout, needsOnboarding, refreshProfile }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, session, profile, needsOnboarding],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
