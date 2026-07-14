'use client';

import React, { useRef, useState } from 'react';
import PocketBase from 'pocketbase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { FlickeringGrid } from '../effects/FlickeringGrid';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

const pb = new PocketBase('https://mmhs.pockethost.io');

export default function AuthForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  // Ref, not state: setSubmitting only lands on the next render, so rapid clicks
  // would all read submitting === false and each fire a request.
  const submittingRef = useRef(false);

  const { push } = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);

    try {
      if (isLogin) {
        await pb.collection('users').authWithPassword(username, password);
        toast.success('Signed in.');
        push('/forum');
      } else {
        const data = {
          username,
          password,
          passwordConfirm: password,
        };

        await pb.collection('users').create(data);
        await pb.collection('users').authWithPassword(username, password);
        toast.success('Account created.');
        push('/forum');
      }
    } catch (error) {
      const err = error as { isAbort?: boolean };
      if (!err.isAbort) {
        console.error('Auth error:', error);
        toast.error(
          isLogin
            ? 'Login failed. Please check your credentials.'
            : 'Registration failed. Please try again.'
        );
      }
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center px-4 bg-background overflow-hidden">
      {/* Hero flickering grid background — same color/density as the home page */}
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
          {isLogin ? 'Sign in to your account' : 'Create a new account'}
        </h2>

        <Card>
          <CardContent className="py-8 px-6 border-none">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-foreground-light mb-1.5"
                >
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="w-full h-10 px-3 rounded-md border border-border-strong bg-surface-100 text-sm text-foreground placeholder:text-foreground-lighter focus:outline-none focus:border-brand-highlight"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-foreground-light mb-1.5"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full h-10 px-3 rounded-md border border-border-strong bg-surface-100 text-sm text-foreground placeholder:text-foreground-lighter focus:outline-none focus:border-brand-highlight"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <Button type="primary" size="medium" block htmlType="submit" disabled={submitting}>
                {submitting ? 'Working…' : isLogin ? 'Sign in' : 'Create account'}
              </Button>
            </form>

            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-foreground-lighter hover:text-foreground transition-colors"
              >
                {isLogin ? 'Need to create an account?' : 'Already have an account?'}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
