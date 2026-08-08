'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { FlickeringGrid } from '../effects/FlickeringGrid';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { TurnstileWidget } from './TurnstileWidget';

const inputClass =
  'w-full h-10 px-3 rounded-md border border-border-strong bg-surface-100 text-sm text-foreground placeholder:text-foreground-lighter focus:outline-none focus:border-brand-highlight';
const labelClass = 'block text-sm font-medium text-foreground-light mb-1.5';

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.1 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.1 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4c-7.5 0-14 4.1-17.7 10.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.4C29.6 35.3 26.9 36 24 36c-5.3 0-9.7-3.3-11.3-7.9l-6.6 5C9.9 39.8 16.4 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.6 5.4C41.5 35.6 44 30.2 44 24c0-1.2-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}

type Mode = 'signin' | 'signup';

export default function AuthForm() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const submittingRef = useRef(false);

  const { push } = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError(null);

    try {
      if (mode === 'signin') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
          options: captchaToken ? { captchaToken } : undefined,
        });
        if (signInError) throw signInError;
        toast.success('Signed in.');
        push('/forum');
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username },
            ...(captchaToken ? { captchaToken } : {}),
          },
        });
        if (signUpError) throw signUpError;
        toast.success('Account created.');
        push('/forum');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      setError(message);
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (oauthError) {
      setError(oauthError.message);
      toast.error('Could not start Google sign-in.');
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center px-4 bg-background overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <FlickeringGrid
          className="size-full"
          squareSize={4}
          gridGap={6}
          color="hsl(239, 84%, 67%)"
          maxOpacity={0.15}
          flickerChance={0.03}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground text-center mb-6">
          {mode === 'signin' ? 'Sign in to your account' : 'Create a new account'}
        </h2>

        <Card>
          <CardContent className="py-8 px-6 border-none">
            <button
              type="button"
              onClick={handleGoogle}
              className="w-full h-10 flex items-center justify-center gap-2.5 rounded-md border border-border-strong bg-surface-100 text-sm font-medium text-foreground hover:brightness-110 transition-all"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-border-default" />
              <span className="text-xs text-foreground-lighter">or</span>
              <div className="h-px flex-1 bg-border-default" />
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {mode === 'signup' && (
                <div>
                  <label htmlFor="username" className={labelClass}>
                    Username
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    minLength={2}
                    maxLength={24}
                    className={inputClass}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              )}

              <div>
                <label htmlFor="email" className={labelClass}>
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className={inputClass}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="text-sm font-medium text-foreground-light">
                    Password
                  </label>
                  {mode === 'signin' && (
                    <Link
                      href="/reset-password"
                      className="text-xs text-foreground-lighter hover:text-foreground transition-colors"
                    >
                      Forgot password?
                    </Link>
                  )}
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  className={inputClass}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <TurnstileWidget onVerify={setCaptchaToken} onExpire={() => setCaptchaToken(null)} />

              {error && <p className="text-sm text-destructive-600">{error}</p>}

              <Button type="primary" size="medium" block htmlType="submit" disabled={submitting}>
                {submitting ? 'Working…' : mode === 'signin' ? 'Sign in' : 'Create account'}
              </Button>
            </form>

            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'signin' ? 'signup' : 'signin');
                  setError(null);
                }}
                className="text-sm text-foreground-lighter hover:text-foreground transition-colors"
              >
                {mode === 'signin' ? 'Need to create an account?' : 'Already have an account?'}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
