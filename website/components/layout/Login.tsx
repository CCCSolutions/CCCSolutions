'use client';

import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { FlickeringGrid } from '../effects/FlickeringGrid';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

// Google "G" SVG icon (official brand colors)
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" className="shrink-0">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function AuthForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // After Google hands back control, Supabase will redirect here.
        // The /auth/callback route exchanges the code for a session.
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (oauthError) {
      setError('Sign-in failed. Please try again.');
      setLoading(false);
    }
    // On success the browser navigates away — no need to stop the loader.
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center px-4 bg-background overflow-hidden">
      {/* Background grid */}
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
        <h1 className="text-3xl font-semibold tracking-tight text-foreground text-center mb-6">
          Sign in to CCC Forum
        </h1>

        {/* Migration notice — prominent, one-time info */}
        <div className="mb-6 rounded-md border border-border-strong bg-surface-100 px-5 py-4 text-sm text-foreground-light leading-relaxed">
          <p className="font-semibold text-foreground mb-1">We&rsquo;ve moved to Google sign-in.</p>
          <p>
            Your old posts and comments are still here, but PocketBase logins no longer work.
            Please sign in with Google to create a new account — your discussion history is
            preserved and will show up under your old username.
          </p>
        </div>

        <Card>
          <CardContent className="py-8 px-6 border-none">
            <Button
              id="google-sign-in-btn"
              type="primary"
              size="medium"
              block
              onClick={handleGoogleSignIn}
              disabled={loading}
              iconLeft={<GoogleIcon />}
            >
              {loading ? 'Redirecting…' : 'Continue with Google'}
            </Button>

            {error && (
              <div className="mt-4 text-center text-sm text-red-600 dark:text-red-400">{error}</div>
            )}

            <p className="mt-5 text-center text-xs text-foreground-lighter">
              By signing in, you agree to keep things respectful on the forum.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
