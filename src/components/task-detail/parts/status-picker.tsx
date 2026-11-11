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
import { ColumnMark } from '@/components/task-meta/column-mark';
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
            <ColumnMark
              color={color}
              done={active?.isDone}
              className="size-1.75"
              doneClassName="size-3"
            />
            {active?.name ?? 'Status'}
            {!disabled && <ChevronDown className="size-3 text-ink-subtle" />}
          </Button>
        ) : (
          <Button variant="ghost" className={propertyButtonClass}>
            <ColumnMark
              color={color}
              done={active?.isDone}
              doneClassName="-mx-0.75"
            />
            {active?.name ?? 'Status'}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        {columns.map((c) => (
          <DropdownMenuItem key={c.id} onClick={() => onChange(c.id)}>
            <ColumnMark color={c.color} done={c.isDone} className="mx-0.75" />
            <span className="flex-1 truncate">{c.name}</span>
            {active?.id === c.id && <Check className="text-ink" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
