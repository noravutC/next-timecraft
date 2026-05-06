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

const PRIORITY_STYLES: Record<
  TaskPriority,
  { bg: string; border: string; text: string; label: string }
> = {
  low: {
    bg: 'rgba(100,116,139,0.10)',
    border: 'rgba(100,116,139,0.30)',
    text: '#334155',
    label: 'Low',
  },
  medium: {
    bg: 'rgba(59,130,246,0.10)',
    border: 'rgba(59,130,246,0.30)',
    text: '#1d4ed8',
    label: 'Medium',
  },
  high: {
    bg: 'rgba(239,68,68,0.10)',
    border: 'rgba(239,68,68,0.30)',
    text: '#b91c1c',
    label: 'High',
  },
};

const ORDER: TaskPriority[] = ['low', 'medium', 'high'];

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
              isPlain ? { color: s.text } : undefined
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
              <Flag className="size-3.5" fill={ps.text} color={ps.text} />
              <span style={{ color: ps.text }}>{ps.label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
