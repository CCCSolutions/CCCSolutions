'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { FlickeringGrid } from '../../components/effects/FlickeringGrid';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { TurnstileWidget } from '../../components/auth/TurnstileWidget';

const inputClass =
  'w-full h-10 px-3 rounded-md border border-border-strong bg-surface-100 text-sm text-foreground placeholder:text-foreground-lighter focus:outline-none focus:border-brand-highlight';

function errorToast(message: string) {
  toast.error(message, { id: 'auth-error', duration: Infinity });
}

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [code, setCode] = useState('');

  const captchaRequired = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const { push } = useRouter();

  const handleSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
      ...(captchaToken ? { captchaToken } : {}),
    });

    setSubmitting(false);
    if (error) {
      errorToast(error.message);
    } else {
      toast.dismiss('auth-error');
      setSent(true);
    }
  };

  // Code path: verify the OTP to establish a recovery session, then hand off to
  // /update-password (which picks up the session and lets them set a new password).
  const handleVerifyCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: 'recovery',
    });
    setSubmitting(false);
    if (error) {
      errorToast(error.message);
    } else if (data.session) {
      toast.dismiss('auth-error');
      push('/update-password');
    }
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
          Reset your password
        </h2>

        <Card>
          <CardContent className="py-8 px-6 border-none">
            {sent ? (
              <div className="space-y-5">
                <p className="text-sm text-foreground-light text-center">
                  If an account exists for <span className="text-foreground">{email}</span>,
                  we&apos;ve sent a reset link and a code. Click the link, or enter the code below.
                </p>
                <form className="space-y-4" onSubmit={handleVerifyCode}>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="Enter code"
                    className={`${inputClass} text-center tracking-[0.15em] placeholder:tracking-normal`}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                  <Button
                    type="primary"
                    size="medium"
                    block
                    htmlType="submit"
                    disabled={submitting || code.trim().length === 0}
                  >
                    {submitting ? 'Verifying…' : 'Verify code'}
                  </Button>
                </form>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleSend}>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-foreground-light mb-1.5"
                  >
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

                <TurnstileWidget
                  onVerify={setCaptchaToken}
                  onExpire={() => setCaptchaToken(null)}
                />

                <Button
                  type="primary"
                  size="medium"
                  block
                  htmlType="submit"
                  disabled={submitting || (captchaRequired && !captchaToken)}
                >
                  {submitting ? 'Sending…' : 'Send reset link'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="mt-5 flex justify-center">
          <Link
            href="/login"
            className="text-sm text-foreground-lighter hover:text-foreground transition-colors"
          >
            Back to log in
          </Link>
        </div>
      </div>
    </div>
  );
}
