'use client';

import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { UserAvatar } from '@/components/people/user-avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { FieldSpec, PickerOption } from './rule-editor-operations';

const OptionMark = ({ option }: { option: PickerOption }) => {
  if (option.person) {
    return (
      <UserAvatar
        name={option.person.name}
        image={option.person.avatar}
        seed={option.person.id}
        size="xs"
      />
    );
  }
  return option.color ? (
    <span
      aria-hidden
      className="size-1.75 shrink-0 rounded-full"
      style={{ backgroundColor: option.color }}
    />
  ) : null;
};

/** One value of a rule, picked from a short list. */
export const OptionPicker = ({
  field,
  onChange,
  disabled = false,
  leading,
  className,
}: {
  field: FieldSpec;
  onChange: (value: string) => void;
  disabled?: boolean;
  /** an icon before the picked value */
  leading?: ReactNode;
  className?: string;
}) => {
  const picked = field.options.find((o) => o.value === field.value);
  const nothingToPick = field.options.length === 0;
  const shown = nothingToPick
    ? 'None on this board yet'
    : (picked?.label ?? field.placeholder ?? 'Choose');
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || nothingToPick}
          aria-label={`${field.label}: ${shown}`}
          className={cn(
            'max-w-full gap-1.5 px-2.5',
            picked?.person && 'pl-1.25',
            className,
          )}
        >
          {leading}
          {picked && <OptionMark option={picked} />}
          <span
            className={cn(
              'truncate',
              !picked && 'text-ink-subtle',
              leading && 'flex-1 text-left',
            )}
          >
            {shown}
          </span>
          <ChevronDown className="size-3.5 text-ink-subtle" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="max-h-72 min-w-44 overflow-y-auto"
      >
        <DropdownMenuRadioGroup value={field.value} onValueChange={onChange}>
          {field.options.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              <OptionMark option={option} />
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
