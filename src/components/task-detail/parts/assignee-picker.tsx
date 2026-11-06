'use client';

import { useMemo, useState } from 'react';
import { Check, Plus } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserAvatar } from '@/components/people/user-avatar';

export interface AssigneeCandidate {
  id: string;
  name: string;
  avatar: string | null;
  email: string;
}

interface AssigneePickerProps {
  candidates: AssigneeCandidate[];
  selectedIds: string[];
  onChange: (next: string[]) => void;
  trigger?: React.ReactNode;
}

export const AssigneePicker = ({
  candidates,
  selectedIds,
  onChange,
  trigger,
}: AssigneePickerProps) => {
  const [query, setQuery] = useState('');
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q),
    );
  }, [query, candidates]);

  const toggle = (id: string) => {
    const next = selectedSet.has(id)
      ? selectedIds.filter((i) => i !== id)
      : [...selectedIds, id];
    onChange(next);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        {trigger ?? (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Add assignee"
            className="rounded-full border border-dashed border-line-strong text-ink-subtle hover:border-ink-faint"
          >
            <Plus className="size-3.5" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-0">
        <div className="border-b border-line-soft p-1.5">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search members"
            aria-label="Search members"
            className="h-7.5 border-0 px-2 focus-visible:ring-0"
          />
        </div>
        <div className="max-h-56 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <p className="px-2 py-2 text-sm text-ink-subtle">No members</p>
          ) : (
            filtered.map((c) => (
              <Button
                key={c.id}
                variant="ghost"
                role="menuitemcheckbox"
                aria-checked={selectedSet.has(c.id)}
                onClick={() => toggle(c.id)}
                className="h-8 w-full justify-start gap-2.5 px-2 font-normal text-ink"
              >
                <UserAvatar
                  name={c.name}
                  image={c.avatar}
                  seed={c.id}
                  size="xs"
                />
                <span className="flex-1 truncate text-left">{c.name}</span>
                {selectedSet.has(c.id) && <Check className="size-3.75" />}
              </Button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
