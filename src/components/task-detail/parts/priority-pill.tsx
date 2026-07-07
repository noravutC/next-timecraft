'use client';

import { Flag } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { TaskPriority } from '@/types';
import { Button } from '@/components/ui/button';
import { PRIORITY_ORDER as ORDER, PRIORITY_STYLES } from '@/lib/task-priority';

interface PriorityPillProps {
  value: TaskPriority;
  onChange: (next: TaskPriority) => void;
  size?: 'sm' | 'md';
  variant?: 'pill' | 'plain';
}

export const PriorityPill = ({
  value,
  onChange,
  size = 'md',
  variant = 'plain',
}: PriorityPillProps) => {
  const s = PRIORITY_STYLES[value];

  const isPlain = variant === 'plain';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={'ghost'}
          size={'xs'}
          className="gap-2 focus-visible:ring-0 text-sm font-medium"
        >
          <Flag
            className={cn(
              isPlain ? 'size-4' : size === 'sm' ? 'size-3' : 'size-3.5',
            )}
            style={
              isPlain ? { color: s.dot } : undefined
            }
            fill="currentColor"
          />
          {s.label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-32">
        {ORDER.map((p) => {
          const ps = PRIORITY_STYLES[p];
          return (
            <DropdownMenuItem
              key={p}
              onClick={() => onChange(p)}
              className="gap-2"
            >
              <Flag className="size-3.5" fill={ps.dot} color={ps.dot} />
              <span style={{ color: ps.text }}>{ps.label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
