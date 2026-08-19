'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

// Supabase (and OAuth) can redirect to the site with an error in the URL *hash*, e.g.
//   https://cccsolutions.ca/#error=access_denied&error_code=otp_expired&error_description=...
// Nothing else reads the hash, so without this the user just lands on a broken-looking
// URL with no feedback. This runs once globally, surfaces a friendly message, and clears
// the hash so a refresh doesn't re-trigger it. (New email links go through /auth/confirm,
// which handles its own errors; this is the catch-all for stray/legacy error redirects.)
export function AuthHashErrorHandler() {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.location.hash) return;

    const params = new URLSearchParams(window.location.hash.slice(1));
    const errorCode = params.get('error_code');
    const error = params.get('error');
    if (!errorCode && !error) return;

    const message =
      errorCode === 'otp_expired'
        ? 'That link expired or was already used. Request a new email, or enter the 6-digit code from it.'
        : (params.get('error_description')?.replace(/\+/g, ' ') ??
          'Something went wrong with that link.');

    toast.error(message, { id: 'auth-hash-error', duration: 8000 });

    // Strip the hash so a refresh doesn't re-fire this and the URL reads clean.
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }, []);

  return null;
}
