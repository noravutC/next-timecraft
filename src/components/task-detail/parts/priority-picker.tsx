'use client';

import { Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { TaskPriority } from '@/types';
import { Button } from '@/components/ui/button';
import { PriorityBars } from '@/components/task-meta/priority-bars';
import { PRIORITY_ORDER, PRIORITY_STYLES } from '@/lib/task-priority';
import { propertyButtonClass } from './property-row';

// high → low, the order people scan for
const PICK_ORDER = [...PRIORITY_ORDER].reverse();

interface PriorityPickerProps {
  value: TaskPriority;
  onChange: (next: TaskPriority) => void;
  disabled?: boolean;
}

export const PriorityPicker = ({
  value,
  onChange,
  disabled,
}: PriorityPickerProps) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild disabled={disabled}>
      <Button variant="ghost" className={propertyButtonClass}>
        <PriorityBars priority={value} decorative />
        {PRIORITY_STYLES[value].label}
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" className="w-44">
      {PICK_ORDER.map((priority) => (
        <DropdownMenuItem key={priority} onClick={() => onChange(priority)}>
          <PriorityBars priority={priority} decorative />
          <span className="flex-1">{PRIORITY_STYLES[priority].label}</span>
          {priority === value && <Check className="text-ink" />}
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);
