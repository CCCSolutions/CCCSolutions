'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, apiFetch } from '../../lib/supabase';

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
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  state: 'pending',
  session: null,
  profile: null,
  logout: async () => {},
  refreshProfile: async () => {},
});

async function fetchProfile(): Promise<Profile | null> {
  try {
    const res = await apiFetch('/user/me');
    if (!res.ok) return null;
    return (await res.json()) as Profile;
  } catch {
    return null;
  }
}

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>('pending');
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let active = true;
    let currentUserId: string | null = null;

    // onAuthStateChange emits INITIAL_SESSION on subscribe, so it covers the initial
    // load too — a separate getSession() fetch would just fire /user/me a second time.
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, s) => {
      if (!active) return;
      setSession(s);

      if (!s) {
        currentUserId = null;
        setProfile(null);
        setState('out');
        return;
      }

      // The listener also fires on token refresh; only refetch the profile when the
      // signed-in user actually changes, so /user/me runs once per login, not per event.
      if (s.user.id === currentUserId) return;
      currentUserId = s.user.id;

      const p = await fetchProfile();
      if (!active) return;
      setProfile(p);
      setState('in');
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    setProfile(await fetchProfile());
  };

  const value = useMemo<AuthContextValue>(
    () => ({ state, session, profile, logout, refreshProfile }),
    [state, session, profile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
