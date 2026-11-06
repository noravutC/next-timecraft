'use client';

import { Check, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ColumnCache } from '@/types';
import { Button } from '@/components/ui/button';
import { propertyButtonClass } from './property-row';

interface StatusPickerProps {
  columns: ColumnCache[];
  activeColumnId: string;
  onChange: (columnId: string) => void;
  /** pill = chip in the sheet header, plain = value in the properties grid */
  variant?: 'pill' | 'plain';
  disabled?: boolean;
}

export const StatusPicker = ({
  columns,
  activeColumnId,
  onChange,
  variant = 'plain',
  disabled,
}: StatusPickerProps) => {
  const active = columns.find((c) => c.id === activeColumnId);
  const color = active?.color ?? '#94a3b8';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        {variant === 'pill' ? (
          <Button
            variant="outline"
            size="xs"
            className="h-6.5 gap-1.5 rounded-full border-line px-2 text-xs text-ink disabled:cursor-default disabled:opacity-100"
          >
            <span
              className="size-1.75 rounded-full"
              style={{ backgroundColor: color }}
            />
            {active?.name ?? 'Status'}
            {!disabled && <ChevronDown className="size-3 text-ink-subtle" />}
          </Button>
        ) : (
          <Button variant="ghost" className={propertyButtonClass}>
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            {active?.name ?? 'Status'}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        {columns.map((c) => (
          <DropdownMenuItem key={c.id} onClick={() => onChange(c.id)}>
            <span
              className="mx-0.75 size-2 shrink-0 rounded-full"
              style={{ backgroundColor: c.color }}
            />
            <span className="flex-1 truncate">{c.name}</span>
            {active?.id === c.id && <Check className="text-ink" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
