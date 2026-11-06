'use client';

import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { BoardColumnLike } from './use-ai-breakdown';

const FALLBACK_COLUMN_COLOR = '#94A3B8';

const ColumnDot = ({ color }: { color?: string }) => (
  <span
    className="size-2 shrink-0 rounded-full"
    style={{ backgroundColor: color ?? FALLBACK_COLUMN_COLOR }}
  />
);

interface TargetSelectProps {
  columns: BoardColumnLike[];
  target: BoardColumnLike;
  onSelect: (columnId: string) => void;
  disabled?: boolean;
}

/** "Add to" picker: which column the generated tasks land in. */
export const AiBreakdownTargetSelect = ({
  columns,
  target,
  onSelect,
  disabled,
}: TargetSelectProps) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild disabled={disabled}>
      <Button
        variant="outline"
        aria-label={`Target column: ${target.title}`}
        className="w-full justify-start gap-2 px-2.5 font-normal"
      >
        <ColumnDot color={target.color} />
        <span className="flex-1 truncate text-left">{target.title}</span>
        <ChevronDown className="size-3.5 text-ink-subtle" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent
      align="start"
      className="max-h-64 w-(--radix-dropdown-menu-trigger-width)"
    >
      {columns.map((col) => (
        <DropdownMenuItem key={col.id} onClick={() => onSelect(col.id)}>
          <ColumnDot color={col.color} />
          <span className="flex-1 truncate">{col.title}</span>
          {col.id === target.id && <Check className="size-3.5 text-ink" />}
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);
