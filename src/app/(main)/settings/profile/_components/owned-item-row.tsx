'use client';

import type { ReactNode } from 'react';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { cn } from '@/lib/utils';
import type { DeletionChoice } from '@/types';

interface OwnedItemRowProps {
  tile: ReactNode;
  name: string;
  meta: string;
  /** null when nobody else is in it: it can only be deleted */
  heirName: string | null;
  choice: DeletionChoice;
  onChoose: (choice: DeletionChoice) => void;
  first: boolean;
}

/** A board or workspace the leaving owner has: give it away or delete it. */
export const OwnedItemRow = ({
  tile,
  name,
  meta,
  heirName,
  choice,
  onChoose,
  first,
}: OwnedItemRowProps) => (
  <div
    className={cn(
      'flex min-h-14 flex-wrap items-center gap-x-3 gap-y-2.5 py-2.5 pr-2.5 pl-3.5',
      !first && 'border-t border-line',
    )}
  >
    {tile}
    <span className="flex min-w-0 flex-1 basis-38 flex-col">
      <span className="truncate text-base font-medium text-ink">{name}</span>
      <span className="text-xs text-ink-subtle">{meta}</span>
    </span>
    {heirName && (
      <SegmentedControl
        aria-label={`What happens to ${name}`}
        value={choice}
        onChange={onChoose}
        options={[
          { value: 'transfer', label: `Give to ${heirName}` },
          { value: 'delete', label: 'Delete it' },
        ]}
        optionClassName="px-2.5 text-xs whitespace-nowrap"
      />
    )}
  </div>
);
