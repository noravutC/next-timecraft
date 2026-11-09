'use client';

import { User } from 'lucide-react';
import { GoogleIcon } from '@/components/auth/google-icon';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';

interface SignInOptionsProps {
  onGoogle: () => void;
  onGuest: () => void;
  guestLoading: boolean;
}

/** The two real ways in: Google, or the shared guest workspace. */
export const SignInOptions = ({
  onGoogle,
  onGuest,
  guestLoading,
}: SignInOptionsProps) => (
  <div className="flex flex-col gap-3">
    <Button
      variant="outline"
      size="lg"
      onClick={onGoogle}
      className="h-11 w-full gap-2.5 font-medium"
    >
      <GoogleIcon className="size-4.5" />
      Continue with Google
    </Button>

    <div className="flex items-center gap-3 text-xs leading-5 text-ink-subtle">
      <span className="h-px flex-1 bg-line" />
      or
      <span className="h-px flex-1 bg-line" />
    </div>

    {/* stays dark while busy (aria-busy) so the white loader shows */}
    <Button
      size="lg"
      onClick={onGuest}
      aria-busy={guestLoading}
      className="h-11 w-full gap-2.5"
    >
      {guestLoading ? (
        <Loader size="xs" onColor />
      ) : (
        <User className="size-4.25" />
      )}
      {guestLoading ? 'Signing in as guest…' : 'Continue as guest'}
    </Button>
    <p className="text-center text-xs leading-4.5 text-pretty text-ink-subtle">
      Guest mode opens one shared demo workspace, so anything you add can be
      seen by other guests.
    </p>
  </div>
);
