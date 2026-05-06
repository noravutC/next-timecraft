'use client';

import { useRef } from 'react';
import { Calendar, X } from 'lucide-react';
import { formatDateShort, formatRelativeDay } from '@/helper/utils/date-format';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DueDateCardProps {
  value: Date | null;
  onChange: (next: Date | null) => void;
}

const toInputValue = (d: Date | null) => {
  if (!d) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const getShortRelativeDay = (d: Date) => {
  const rel = formatRelativeDay(d);
  if (rel.startsWith('In ')) {
    return rel.toLowerCase().replace(' days', 'd');
  }
  return rel.toLowerCase();
};

export const DueDateCard = ({ value = new Date(), onChange }: DueDateCardProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const in3Days = new Date(today);
  in3Days.setDate(today.getDate() + 3);

  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7 || 7));

  const in2Weeks = new Date(today);
  in2Weeks.setDate(today.getDate() + 14);

  const PRESETS = [
    { label: 'Today', date: today },
    { label: 'Tomorrow', date: tomorrow },
    { label: 'In 3 days', date: in3Days },
    { label: 'Next Monday', date: nextMonday },
    { label: 'In 2 weeks', date: in2Weeks },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={'ghost'}
          size={'xs'}
          className={cn("gap-2 text-sm font-medium focus-visible:ring-0", value ? "bg-muted" : "border border-muted-foreground/50 border-dashed")}
        >
          <Calendar className="size-4" />
          {value ? (
            <span className="flex items-center gap-1.5 text-foreground">
              {formatDateShort(value)} <span className="text-muted-foreground font-medium">·</span> {getShortRelativeDay(value)}
              <div
                role="button"
                tabIndex={0}
                className="ml-1 rounded-sm hover:bg-black/10 dark:hover:bg-white/20 p-0.5 transition-colors"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    onChange(null);
                  }
                }}
              >
                <X className="size-3.5 text-muted-foreground" />
              </div>
            </span>
          ) : (
            <span>No date</span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-[240px] p-2">
        <div className="flex flex-col gap-0.5 mb-1">
          {PRESETS.map((preset) => (
            <DropdownMenuItem
              key={preset.label}
              onClick={() => onChange(preset.date)}
              className="flex items-center justify-between cursor-pointer rounded-md px-2 py-2 text-sm"
            >
              <span>{preset.label}</span>
              <span className="text-muted-foreground text-xs font-medium">
                {formatDateShort(preset.date)}
              </span>
            </DropdownMenuItem>
          ))}
        </div>
        
        <div className="h-px bg-border my-2 -mx-2" />
        
        <div className="pt-1">
          <input
            ref={inputRef}
            type="date"
            value={toInputValue(value)}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) {
                onChange(null);
                return;
              }
              const [yyyy, mm, dd] = v.split('-').map(Number);
              onChange(new Date(yyyy, mm - 1, dd));
            }}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};