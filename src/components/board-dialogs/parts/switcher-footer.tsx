'use client';

import { Kbd } from '@/components/ui/kbd';
import { modKeyLabel } from '@/lib/platform';

/** Keyboard legend under the ⌘K palette. */
export const SwitcherFooter = () => (
  <div className="flex h-10 shrink-0 items-center gap-3.5 border-t border-line bg-surface px-4 text-xs text-ink-subtle">
    <span className="inline-flex items-center gap-1.5">
      <Kbd>↑</Kbd>
      <Kbd>↓</Kbd>
      navigate
    </span>
    <span className="inline-flex items-center gap-1.5">
      <Kbd>↵</Kbd>
      open
    </span>
    <span className="flex-1" />
    <span className="inline-flex items-center gap-1.5">
      Open anywhere with
      <Kbd>{modKeyLabel()}</Kbd>
      <Kbd>K</Kbd>
    </span>
  </div>
);
