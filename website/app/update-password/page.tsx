'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { FlickeringGrid } from '../../components/effects/FlickeringGrid';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';

const inputClass =
  'w-full h-10 px-3 rounded-md border border-border-strong bg-surface-100 text-sm text-foreground placeholder:text-foreground-lighter focus:outline-none focus:border-brand-highlight';

export default function UpdatePasswordPage() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  // Supabase's password-recovery link lands here with the recovery session
  // already in the URL; supabase-js picks it up automatically (detectSessionInUrl)
  // and fires PASSWORD_RECOVERY once it has.
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const { error: updateError } = await supabase.auth.updateUser({ password });

    setSubmitting(false);
    if (updateError) {
      toast.error(updateError.message, { id: 'auth-error', duration: Infinity });
      return;
    }
    toast.dismiss('auth-error');
    toast.success('Password updated.');
    router.push('/forum');
  };

  return (
    <div className="relative min-h-[calc(100svh-var(--nav-h))] flex flex-col justify-center items-center px-4 bg-background overflow-hidden">
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
          Set a new password
        </h2>

        <Card>
          <CardContent className="py-8 px-6 border-none">
            {!ready ? (
              <p className="text-sm text-foreground-light text-center">
                Open this page from the link in your password reset email.
              </p>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-foreground-light mb-1.5"
                  >
                    New password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className={inputClass}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <Button type="primary" size="medium" block htmlType="submit" disabled={submitting}>
                  {submitting ? 'Saving…' : 'Update password'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
