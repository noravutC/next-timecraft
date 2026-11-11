import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import type { InsightsPerson } from '@/types';
import { PersonMark } from './person-mark';

/** A task in a list card: what leads it, its two lines and who has it. */
export const TaskListRow = ({
  lead,
  title,
  why,
  owner,
  ownerNames,
  onOpen,
}: {
  /** the chip or date in front of the title */
  lead: ReactNode;
  title: string;
  why: string;
  owner: InsightsPerson | null;
  ownerNames: string;
  onOpen: () => void;
}) => (
  <Button
    variant="ghost"
    onClick={onOpen}
    className="h-auto min-h-11 w-full justify-start gap-2.5 rounded-lg px-2.5 py-1 text-left font-normal whitespace-normal"
  >
    {lead}
    <span className="flex min-w-0 flex-1 flex-col">
      <span className="truncate text-sm font-medium text-ink">{title}</span>
      <span className="truncate text-xs text-ink-subtle">{why}</span>
    </span>
    <span title={ownerNames} className="flex shrink-0">
      <PersonMark person={owner} />
    </span>
  </Button>
);
