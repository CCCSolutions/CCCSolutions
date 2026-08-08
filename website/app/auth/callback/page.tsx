'use client';

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

function CallbackHandler() {
  const router = useRouter();

  useEffect(() => {
    let active = true;
    let cleanupFn: (() => void) | undefined;

    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (code) {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('Error exchanging code for session:', error.message);
            if (active) router.push('/login?error=auth_failed');
            return;
          }
        } catch (err) {
          console.error('Unexpected error during code exchange:', err);
          if (active) router.push('/login?error=auth_failed');
          return;
        }
      }

      const { data } = await supabase.auth.getSession();
      if (!active) return;

      if (data.session) {
        router.push('/forum');
      } else {
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
          if (session && active) {
            subscription.unsubscribe();
            router.push('/forum');
          }
        });

        const timeoutId = setTimeout(() => {
          subscription.unsubscribe();
          if (active) router.push('/login?error=timeout');
        }, 5000);

        cleanupFn = () => {
          clearTimeout(timeoutId);
          subscription.unsubscribe();
        };
      }
    };

    handleCallback();

    return () => {
      active = false;
      if (cleanupFn) cleanupFn();
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <p className="text-foreground-light">Completing sign-in…</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <p className="text-foreground-light">Loading…</p>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
