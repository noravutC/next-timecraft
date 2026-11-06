'use client';

import type { LucideIcon } from 'lucide-react';
import { CommandItem } from '@/components/ui/command';
import { cn } from '@/lib/utils';

/** Action row in the ⌘K palette: outlined icon box, label, optional hint. */
export const SwitcherActionItem = ({
  id,
  icon: Icon,
  label,
  hint,
  dashed = false,
  onSelect,
}: {
  id: string;
  icon: LucideIcon;
  label: string;
  hint?: string;
  /** Dashed box marks a "create" action. */
  dashed?: boolean;
  onSelect: () => void;
}) => (
  <CommandItem value={`action:${id}`} onSelect={onSelect}>
    <span
      className={cn(
        'grid size-6.5 shrink-0 place-items-center rounded-md border text-ink-muted',
        dashed ? 'border-dashed border-line-strong' : 'border-line',
      )}
    >
      <Icon className="size-3.5" />
    </span>
    <span className="truncate">{label}</span>
    {hint && (
      <>
        <span className="flex-1" />
        <span className="max-w-50 shrink-0 truncate text-xs text-ink-subtle">
          {hint}
        </span>
      </>
    )}
  </CommandItem>
);
