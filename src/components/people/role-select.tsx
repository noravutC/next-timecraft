'use client';

import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface RoleSelectProps<R extends string> {
  value: R;
  options: readonly R[];
  labels: Record<R, string>;
  onChange: (role: R) => void;
  'aria-label': string;
  disabled?: boolean;
  className?: string;
}

/** A role, shown like a select: click to pick another. */
export function RoleSelect<R extends string>({
  value,
  options,
  labels,
  onChange,
  disabled,
  className,
  ...props
}: RoleSelectProps<R>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button
          type="button"
          variant="outline"
          aria-label={props['aria-label']}
          className={cn(
            'h-7.5 w-24 justify-between gap-1.5 pr-2 pl-2.5 font-normal',
            className,
          )}
        >
          {labels[value]}
          <ChevronDown className="size-3.5 text-ink-subtle" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {options.map((option) => (
          <DropdownMenuItem
            key={option}
            onClick={() => option !== value && onChange(option)}
          >
            <span className="flex-1">{labels[option]}</span>
            {option === value && <Check className="size-3.5 text-ink" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
