'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  filterTimeZones,
  timeZoneLabel,
  timeZoneOptions,
} from '@/helper/utils/time-zone';

interface TimeZonePickerProps {
  value: string;
  onChange: (timeZone: string) => void;
  disabled?: boolean;
}

/** A searchable list of every time zone, labeled "(GMT+07:00) Bangkok". */
export const TimeZonePicker = ({
  value,
  onChange,
  disabled,
}: TimeZonePickerProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const options = useMemo(() => timeZoneOptions(), []);
  const shown = useMemo(
    () => filterTimeZones(options, query),
    [options, query],
  );
  const label = timeZoneLabel(value);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery('');
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          aria-label={`Time zone: ${label}`}
          className="h-9.5 w-full justify-start gap-2 pr-2.5 pl-3 text-base font-normal text-ink"
        >
          <Globe className="size-3.75 text-ink-subtle" />
          <span className="flex-1 truncate text-left">{label}</span>
          <ChevronDown className="size-3.5 text-ink-subtle" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) p-0"
      >
        <div className="border-b border-line-soft p-1.5">
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by city or offset"
            aria-label="Search time zones"
            className="h-7.5 border-0 px-2 focus-visible:ring-0"
          />
        </div>
        <div role="listbox" className="max-h-64 overflow-y-auto p-1">
          {shown.length === 0 ? (
            <p className="px-2 py-2 text-sm text-ink-subtle">
              No time zones match
            </p>
          ) : (
            shown.map((option) => (
              <Button
                key={option.value}
                variant="ghost"
                role="option"
                aria-selected={option.value === value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className="h-8 w-full justify-start gap-2 px-2 font-normal text-ink"
              >
                <span className="flex-1 truncate text-left">
                  {option.label}
                </span>
                {option.value === value && <Check className="size-3.75" />}
              </Button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
