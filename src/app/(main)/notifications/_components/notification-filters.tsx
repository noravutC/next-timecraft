'use client';

import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { NotificationKind } from '@/helper/utils/notification-view';
import { cn } from '@/lib/utils';
import type { NotificationCounts } from '@/services/notification.service';

const KINDS: { kind: NotificationKind; label: string }[] = [
  { kind: 'all', label: 'All' },
  { kind: 'unread', label: 'Unread' },
  { kind: 'mentions', label: 'Mentions' },
  { kind: 'assigned', label: 'Assigned' },
  { kind: 'due', label: 'Due dates' },
  { kind: 'invites', label: 'Invites' },
];

interface NotificationFiltersProps {
  kind: NotificationKind;
  onKind: (kind: NotificationKind) => void;
  counts: NotificationCounts | null;
  boards: { id: string; name: string }[];
  projectId: string | null;
  onProject: (projectId: string | null) => void;
}

/** The chips, and which board. */
export const NotificationFilters = ({
  kind,
  onKind,
  counts,
  boards,
  projectId,
  onProject,
}: NotificationFiltersProps) => (
  <div className="flex flex-wrap items-center gap-2 border-b border-line pb-3.5">
    <div
      role="tablist"
      aria-label="Filter notifications"
      className="flex flex-wrap gap-1.5"
    >
      {KINDS.map((option) => {
        const active = option.kind === kind;
        return (
          <Button
            key={option.kind}
            role="tab"
            aria-selected={active}
            variant="outline"
            size="xs"
            onClick={() => onKind(option.kind)}
            className={cn(
              'h-7 gap-1.5 rounded-full px-2.5 font-normal',
              active &&
                'border-ink bg-ink text-white hover:bg-ink hover:text-white',
            )}
          >
            {option.label}
            {counts && (
              <span
                className={cn(
                  'font-mono text-2xs',
                  active ? 'text-line-strong' : 'text-ink-subtle',
                )}
              >
                {counts[option.kind]}
              </span>
            )}
          </Button>
        );
      })}
    </div>
    <span className="flex-1" />
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="xs" className="h-7 gap-1.5 font-normal">
          {boards.find((b) => b.id === projectId)?.name ?? 'All boards'}
          <ChevronDown className="size-3.5 text-ink-subtle" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onSelect={() => onProject(null)}>
          <span className="flex-1">All boards</span>
          {projectId === null && <Check className="size-3.5 text-ink" />}
        </DropdownMenuItem>
        {boards.length > 0 && <DropdownMenuSeparator />}
        {boards.map((board) => (
          <DropdownMenuItem key={board.id} onSelect={() => onProject(board.id)}>
            <span className="flex-1 truncate">{board.name}</span>
            {projectId === board.id && <Check className="size-3.5 text-ink" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
);
