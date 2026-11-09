'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';

/** Profile settings are off for the shared guest account. */
export const GuestDemoNote = () => (
  <div
    role="note"
    className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-popover border border-warning-line bg-warning-soft px-4 py-3.5"
  >
    <span className="min-w-0 flex-1 basis-80 text-sm leading-5 text-warning-text">
      You’re in the shared guest demo. Everyone who tries it uses this same
      account, so profile settings are off and the demo resets every night. Sign
      in with Google to keep your own boards.
    </span>
    <Button size="sm" onClick={() => void signIn('google')}>
      Sign in with Google
    </Button>
  </div>
);
