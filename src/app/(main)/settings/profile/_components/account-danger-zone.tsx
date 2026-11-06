'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DeleteAccountDialog } from './delete-account-dialog';

/** Delete account, behind a dialog that asks what happens to your boards. */
export const AccountDangerZone = () => {
  const [open, setOpen] = useState(false);

  return (
    <section aria-labelledby="pf-danger" className="flex flex-col gap-2.5">
      <h2 id="pf-danger" className="text-md font-semibold text-ink">
        Danger zone
      </h2>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-popover border border-danger-line p-4.5">
        <span className="flex min-w-0 flex-1 basis-80 flex-col gap-0.5">
          <span className="text-base font-medium text-ink">Delete account</span>
          <span className="text-sm leading-4.75 text-ink-subtle">
            Signs you out everywhere and removes you from every board. Boards
            you own get a new owner or are deleted, your choice.
          </span>
        </span>
        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          className="border-danger-line text-danger-text hover:border-danger-line hover:bg-danger-soft hover:text-danger-text"
        >
          Delete account…
        </Button>
      </div>
      <DeleteAccountDialog open={open} onOpenChange={setOpen} />
    </section>
  );
};
