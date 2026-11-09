'use client';

import { X } from 'lucide-react';
import {
  dueDatePresets,
  formatDateShort,
  formatMonthDay,
  formatRelativeDay,
  fromDateInputValue,
  toDateInputValue,
} from '@/helper/utils/date-format';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { propertyButtonClass } from './property-row';

interface DueDatePickerProps {
  value: Date | null;
  onChange: (next: Date | null) => void;
  disabled?: boolean;
}

export const DueDatePicker = ({
  value,
  onChange,
  disabled,
}: DueDatePickerProps) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild disabled={disabled}>
      <Button variant="ghost" className={propertyButtonClass}>
        {value ? (
          <>
            {formatDateShort(value)}
            <span className="font-mono text-xs text-ink-subtle lowercase">
              {formatRelativeDay(value)}
            </span>
          </>
        ) : (
          <span className="text-ink-subtle">No date</span>
        )}
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" className="w-60">
      {dueDatePresets().map((preset) => (
        <DropdownMenuItem
          key={preset.label}
          onClick={() => onChange(preset.date)}
        >
          <span className="flex-1">{preset.label}</span>
          <span className="font-mono text-xs text-ink-subtle">
            {formatMonthDay(preset.date)}
          </span>
        </DropdownMenuItem>
      ))}
      <DropdownMenuSeparator />
      <div className="p-1">
        {/* keys must reach the input, not the menu's type-ahead */}
        <Input
          type="date"
          aria-label="Pick a due date"
          value={toDateInputValue(value)}
          onChange={(e) => onChange(fromDateInputValue(e.target.value))}
          onKeyDown={(e) => e.stopPropagation()}
        />
      </div>
      {value && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onChange(null)}>
            <X />
            Clear date
          </DropdownMenuItem>
        </>
      )}
    </DropdownMenuContent>
  </DropdownMenu>
);
