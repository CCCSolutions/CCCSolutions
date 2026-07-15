'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { SectionContainer } from '../../components/ui/section-container';
import { useAuth } from '../../components/auth/AuthProvider';
import { apiFetch } from '../../lib/supabase';
import { FlickeringGrid } from '../../components/effects/FlickeringGrid';

// Default avatar shown when avatar_url is null
const DEFAULT_AVATAR = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'><rect width='80' height='80' rx='40' fill='%23312e81'/><text x='50%25' y='54%25' dominant-baseline='middle' text-anchor='middle' font-size='36' fill='white' font-family='sans-serif'>?</text></svg>`;

type Step = 'username' | 'avatar' | 'done';

export default function OnboardingPage() {
  const { profile, refreshProfile, state } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>('username');
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [usernameLoading, setUsernameLoading] = useState(false);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState('');
  const [avatarLoading, setAvatarLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // If not logged in, send to /login
  React.useEffect(() => {
    if (state === 'out') {
      router.replace('/login');
    }
  }, [state, router]);

  React.useEffect(() => {
    if (step === 'done') {
      router.replace('/forum');
    }
  }, [step, router]);


  // If already onboarded (non-placeholder username), go straight to forum
  if (state === 'in' && profile && !/^user_\d+$/.test(profile.username) && step === 'username') {
    router.replace('/forum');
    return null;
  }

  // --------------------------------------------------------------------------
  // Step 1: Username
  // --------------------------------------------------------------------------

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameError('');

    const trimmed = username.trim();
    if (!trimmed) {
      setUsernameError('Please enter a username.');
      return;
    }

    setUsernameLoading(true);
    const res = await apiFetch('/user/me/username', {
      method: 'PATCH',
      body: JSON.stringify({ username: trimmed }),
    });
    setUsernameLoading(false);

    if (res.ok) {
      await refreshProfile();
      setStep('avatar');
    } else {
      const body = await res.json().catch(() => ({})) as { error?: string };
      if (res.status === 409) {
        setUsernameError('That username is already taken. Please try another.');
      } else if (res.status === 400 && body.error) {
        setUsernameError(body.error);
      } else {
        setUsernameError('Something went wrong. Please try again.');
      }
    }
  };

  // --------------------------------------------------------------------------
  // Step 2: Avatar
  // --------------------------------------------------------------------------

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setAvatarError('');
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setAvatarError('Please select an image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('Image must be under 2 MB.');
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    setAvatarLoading(true);
    setAvatarError('');

    const form = new FormData();
    form.append('file', avatarFile);

    const res = await apiFetch('/user/me/avatar', { method: 'POST', body: form });
    setAvatarLoading(false);

    if (res.ok) {
      await refreshProfile();
      setStep('done');
    } else {
      const body = await res.json().catch(() => ({})) as { error?: string };
      setAvatarError(body.error ?? 'Upload failed. Please try again.');
    }
  };

  const handleSkipAvatar = async () => {
    await refreshProfile();
    setStep('done');
  };

  // --------------------------------------------------------------------------
  // Done
  // --------------------------------------------------------------------------

  if (step === 'done') {
    router.replace('/forum');
    return null;
  }

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center px-4 bg-background overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <FlickeringGrid
          className="size-full"
          squareSize={4}
          gridGap={6}
          color="hsl(239, 84%, 67%)"
          maxOpacity={0.12}
          flickerChance={0.025}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Progress indicators */}
        <div className="flex items-center gap-2 justify-center mb-8">
          {(['username', 'avatar'] as const).map((s, i) => (
            <React.Fragment key={s}>
              <div
                className={`h-2 w-2 rounded-full transition-colors ${
                  step === s
                    ? 'bg-brand'
                    : i < (['username', 'avatar'] as const).indexOf(step)
                      ? 'bg-brand/50'
                      : 'bg-border-strong'
                }`}
              />
              {i < 1 && <div className="h-px w-10 bg-border-strong" />}
            </React.Fragment>
          ))}
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* STEP 1: Username */}
        {/* ------------------------------------------------------------------ */}
        {step === 'username' && (
          <>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground text-center mb-2">
              Choose your username
            </h1>
            <p className="text-sm text-foreground-lighter text-center mb-6">
              This is how other forum members will see you.
            </p>
            <Card>
              <CardContent className="py-8 px-6 border-none">
                <form onSubmit={handleUsernameSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="onboarding-username"
                      className="block text-sm font-medium text-foreground-light mb-1.5"
                    >
                      Username
                    </label>
                    <input
                      id="onboarding-username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. algoqueen"
                      autoComplete="off"
                      spellCheck={false}
                      maxLength={30}
                      className="w-full h-10 px-3 rounded-md border border-border-strong bg-surface-100 text-sm text-foreground placeholder:text-foreground-lighter focus:outline-none focus:border-brand-highlight"
                      required
                    />
                    <p className="mt-1 text-xs text-foreground-lighter">
                      3–30 chars · letters, numbers, underscores only
                    </p>
                    {usernameError && (
                      <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">{usernameError}</p>
                    )}
                  </div>
                  <Button
                    type="primary"
                    size="medium"
                    block
                    htmlType="submit"
                    disabled={usernameLoading}
                  >
                    {usernameLoading ? 'Saving…' : 'Continue'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* STEP 2: Avatar */}
        {/* ------------------------------------------------------------------ */}
        {step === 'avatar' && (
          <>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground text-center mb-2">
              Add a profile photo
            </h1>
            <p className="text-sm text-foreground-lighter text-center mb-6">
              Optional — you can always change it later.
            </p>
            <Card>
              <CardContent className="py-8 px-6 border-none flex flex-col items-center gap-5">
                {/* Preview */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="relative group rounded-full overflow-hidden border-2 border-border-strong hover:border-brand transition-colors focus:outline-none focus:ring-2 focus:ring-brand-highlight"
                  aria-label="Select avatar image"
                >
                  <Image
                    src={avatarPreview ?? DEFAULT_AVATAR}
                    alt="Avatar preview"
                    width={80}
                    height={80}
                    className="rounded-full object-cover"
                    unoptimized={!!avatarPreview}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                    <span className="text-white text-xs font-medium">Change</span>
                  </div>
                </button>

                <input
                  ref={fileInputRef}
                  id="avatar-file-input"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleFileChange}
                />

                {avatarError && (
                  <p className="text-xs text-red-500 dark:text-red-400">{avatarError}</p>
                )}

                <div className="w-full space-y-2">
                  {avatarFile && (
                    <Button
                      type="primary"
                      size="medium"
                      block
                      onClick={handleAvatarUpload}
                      disabled={avatarLoading}
                    >
                      {avatarLoading ? 'Uploading…' : 'Upload photo'}
                    </Button>
                  )}
                  {!avatarFile && (
                    <Button
                      type="default"
                      size="medium"
                      block
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Choose image
                    </Button>
                  )}
                  <Button
                    type="default"
                    size="medium"
                    block
                    onClick={handleSkipAvatar}
                    disabled={avatarLoading}
                  >
                    Skip for now
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
