'use client';

import { ChevronDown, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ColumnCache } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface StatusPickerProps {
  columns: ColumnCache[];
  activeColumnId: string;
  onChange: (columnId: string) => void;
  size?: 'sm' | 'md';
}

export const StatusPicker = ({
  columns,
  activeColumnId,
  onChange,
  size = 'md',
}: StatusPickerProps) => {
  const active = columns.find((c) => c.id === activeColumnId);
  const color = active?.color ?? '#94a3b8';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={'ghost'}
          size={'xs'}
          className={cn('gap-2 rounded-full text-xs focus-visible:ring-0')}
          style={{
            backgroundColor: `${color}1f`,
          }}
        >
          <span
            className="size-2.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          {active?.name ?? 'Status'}
          <ChevronDown className="size-3 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {columns.map((c) => (
          <DropdownMenuItem
            key={c.id}
            onClick={() => onChange(c.id)}
            className={cn("gap-2 cursor-pointer", active?.id === c.id && 'bg-muted')}
          >
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: c.color }}
            />
            <span className="">{c.name}</span>
            {active?.id === c.id && <Check className="size-4 ml-auto text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
