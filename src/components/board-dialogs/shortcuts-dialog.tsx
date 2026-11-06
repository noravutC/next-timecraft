'use client';

import { Fragment } from 'react';
import { Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Kbd } from '@/components/ui/kbd';
import { SHORTCUT_GROUPS } from '@/helper/utils/shortcuts';
import { isApplePlatform, modKeyLabel } from '@/lib/platform';

/** ? : every keyboard shortcut, grouped by where it works. */
export const ShortcutsDialog = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => (
  <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
    <DialogContent className="sm:max-w-170">
      <DialogHeader className="border-b border-line pb-4">
        <DialogTitle>Keyboard shortcuts</DialogTitle>
        <DialogDescription className="leading-5">
          Press <Kbd>?</Kbd> on a board, outside a text field, to open this
          list.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-x-8 gap-y-6 px-6 pt-5 pb-6 sm:grid-cols-2">
        {SHORTCUT_GROUPS.map((group) => (
          <section key={group.title} className="flex flex-col gap-1">
            <h3 className="pb-1 text-xs font-medium text-ink-subtle">
              {group.title}
            </h3>
            <dl className="flex flex-col">
              {group.rows.map((row) => (
                <div
                  key={row.label}
                  className="flex min-h-9.25 items-center gap-3 border-b border-line-soft"
                >
                  <dt className="flex-1 text-sm text-ink">{row.label}</dt>
                  <dd className="flex items-center gap-1">
                    {row.keys.map((k, i) => (
                      <Fragment key={i}>
                        <Kbd>{k.key === 'mod' ? modKeyLabel() : k.key}</Kbd>
                        {k.then && (
                          <span className="text-xs text-ink-subtle">
                            {k.then}
                          </span>
                        )}
                      </Fragment>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
      <DialogFooter className="justify-start gap-2 text-xs text-ink-subtle">
        <Info className="size-3.5" />
        {isApplePlatform()
          ? 'On Windows and Linux, use Ctrl where you see ⌘.'
          : 'On a Mac, use ⌘ where you see Ctrl.'}
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
