'use client';

import type { ReactNode } from 'react';
import { Archive, ArrowRight, Check, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { shortcutLabel } from '@/lib/platform';

export type UndoIcon = 'archive' | 'move' | 'trash' | 'edit' | 'done';

const ICONS = {
  archive: Archive,
  move: ArrowRight,
  trash: Trash2,
  edit: Pencil,
  done: Check,
} as const;

interface UndoToastProps {
  icon: UndoIcon;
  title: ReactNode;
  /** a second line, e.g. the task's title */
  detail?: string;
  /** the button: Undo, or Archive again after undoing */
  action?: { label: string; onClick: () => void };
  /** the ⌘Z hint, while this change can still be undone */
  showShortcut?: boolean;
}

/** A change you can take back: icon, what happened, ⌘Z, Undo. */
export const UndoToast = ({
  icon,
  title,
  detail,
  action,
  showShortcut = false,
}: UndoToastProps) => {
  const Icon = ICONS[icon];
  return (
    // the Toaster draws the card around it
    <div role="status" className="flex w-full items-center gap-3">
      <Icon className="size-4 shrink-0 text-ink-muted" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm [&_strong]:font-semibold">
          {title}
        </span>
        {detail && (
          <span className="truncate text-xs text-ink-subtle">{detail}</span>
        )}
      </span>
      {showShortcut && <Kbd>{shortcutLabel('Z')}</Kbd>}
      {action && (
        <Button
          variant="outline"
          size="xs"
          onClick={action.onClick}
          className="h-7 shrink-0"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};
