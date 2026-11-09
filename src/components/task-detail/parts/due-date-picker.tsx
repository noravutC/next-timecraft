'use client';

import Link from 'next/link';
import { Bell, X } from 'lucide-react';
import {
  REMINDER_OPTIONS,
  reminderShortLabel,
} from '@/helper/utils/due-reminder';
import { cn } from '@/lib/utils';
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
  /** days before the due date to remind assignees; null for none */
  reminder: number | null;
  onReminderChange: (daysBefore: number | null) => void;
  /** what the reminder will do, in a sentence */
  reminderSummary: string;
}

export const DueDatePicker = ({
  value,
  onChange,
  disabled,
  reminder,
  onReminderChange,
  reminderSummary,
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
            {reminder !== null && (
              <span className="inline-flex items-center gap-1 text-xs text-ink-subtle">
                <Bell className="size-3" />
                {reminderShortLabel(reminder)}
              </span>
            )}
          </>
        ) : (
          <span className="text-ink-subtle">No date</span>
        )}
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" className="w-80">
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
          <div className="flex flex-col gap-2 px-2 py-2">
            <span className="flex items-center gap-1.5 text-sm font-medium text-ink">
              <Bell className="size-3.5 text-ink-subtle" />
              Remind assignees
            </span>
            <div
              role="radiogroup"
              aria-label="Reminder"
              className="flex flex-wrap gap-1.5"
            >
              {REMINDER_OPTIONS.map((option) => {
                const on = option.daysBefore === reminder;
                return (
                  <Button
                    key={option.label}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    variant="outline"
                    size="xs"
                    onClick={() => onReminderChange(option.daysBefore)}
                    className={cn(
                      'h-7 rounded-full px-2.5 font-normal',
                      on &&
                        'border-ink bg-ink text-white hover:bg-ink hover:text-white',
                    )}
                  >
                    {option.label}
                  </Button>
                );
              })}
            </div>
            <p className="text-xs leading-4.25 text-ink-subtle">
              {reminderSummary}{' '}
              <Link
                href="/settings/notifications"
                className="text-ink-muted underline underline-offset-2"
              >
                Notification settings
              </Link>
            </p>
          </div>
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
