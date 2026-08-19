'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { EmailOtpType } from '@supabase/supabase-js';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/ui/button';

// Email links land here instead of Supabase's /auth/v1/verify. That endpoint consumes
// the token on a raw GET, so Microsoft/Outlook "Safe Links" scanners — which pre-fetch
// every link in an email — burn it before the user clicks. This page instead runs
// verifyOtp in client JS (which scanners don't execute), so the token survives the
// prescan and is only spent when a real browser loads the page. The 6-digit code in the
// same email is the fallback for the rare scanner that does execute JS.

// Where to send the user after a successful verify, keyed by OTP type.
const DEST: Partial<Record<EmailOtpType, string>> = {
  recovery: '/update-password',
};

const VALID_TYPES: EmailOtpType[] = [
  'signup',
  'recovery',
  'email',
  'email_change',
  'invite',
  'magiclink',
];

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[calc(100svh-var(--nav-h))] flex items-center justify-center px-4 bg-background text-foreground">
      <div className="w-full max-w-md text-center">{children}</div>
    </div>
  );
}

function ConfirmHandler() {
  const router = useRouter();
  const params = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'error'>('verifying');

  const rawType = params.get('type');
  const type: EmailOtpType = VALID_TYPES.includes(rawType as EmailOtpType)
    ? (rawType as EmailOtpType)
    : 'signup';

  useEffect(() => {
    const tokenHash = params.get('token_hash');
    if (!tokenHash) {
      setStatus('error');
      return;
    }

    let active = true;
    supabase.auth.verifyOtp({ token_hash: tokenHash, type }).then(({ error }) => {
      if (!active) return;
      if (error) {
        setStatus('error');
        return;
      }
      router.replace(DEST[type] ?? '/forum');
    });

    return () => {
      active = false;
    };
  }, [params, type, router]);

  if (status === 'verifying') {
    return (
      <Centered>
        <p className="text-foreground-light">Confirming…</p>
      </Centered>
    );
  }

  // The link expired, was already used, or was consumed by an email scanner. Point the
  // user at the 6-digit code, which never has this problem.
  const codeHref = type === 'recovery' ? '/reset-password' : '/signup';
  return (
    <Centered>
      <h1 className="text-2xl font-semibold tracking-tight mb-3">This link didn&apos;t work</h1>
      <p className="text-foreground-light mb-6">
        It may have expired, already been used, or been pre-scanned by your email provider. Enter
        the <span className="text-foreground font-medium">6-digit code</span> from the same email
        instead, or request a new one.
      </p>
      <div className="flex justify-center gap-3">
        <Button asChild type="primary" size="medium">
          <Link href={codeHref}>Enter the code</Link>
        </Button>
        <Button asChild type="default" size="medium">
          <Link href="/login">Back to login</Link>
        </Button>
      </div>
    </Centered>
  );
}

export default function AuthConfirmPage() {
  return (
    <Suspense
      fallback={
        <Centered>
          <p className="text-foreground-light">Loading…</p>
        </Centered>
      }
    >
      <ConfirmHandler />
    </Suspense>
  );
}
