'use client';

import { useEffect } from 'react';
import { getSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { SIGN_IN_AGAIN_URL } from '@/helper/utils/sign-in-destination';

// sign-in happens in a window of its own, so this tab and what's typed in
// it stay as they are
const openSignIn = () => {
  const features = 'popup,width=480,height=680';
  if (!window.open(SIGN_IN_AGAIN_URL, 'timecraft-sign-in', features)) {
    window.open(SIGN_IN_AGAIN_URL, '_blank');
  }
};

/** Over the app, still mounted, once the session is gone. */
export const SessionExpiredDialog = () => {
  // back from the sign-in window: check, so the dialog goes away
  useEffect(() => {
    const recheck = () => void getSession();
    window.addEventListener('focus', recheck);
    return () => window.removeEventListener('focus', recheck);
  }, []);

  return (
    <Dialog open>
      <DialogContent
        role="alertdialog"
        showCloseButton={false}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        className="sm:max-w-100"
      >
        <div className="flex flex-col gap-1.5 p-5">
          <DialogTitle className="text-md font-semibold text-ink">
            Your session expired
          </DialogTitle>
          <DialogDescription className="text-sm leading-5 text-ink-muted">
            Sign in again to keep working. Anything you were typing stays in
            this tab.
          </DialogDescription>
        </div>
        <DialogFooter className="px-5 py-3">
          <Button size="sm" onClick={openSignIn}>
            Sign in again
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
