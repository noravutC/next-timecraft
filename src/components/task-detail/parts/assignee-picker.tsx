"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

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
  const [query, setQuery] = useState("");
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
          <button
            type="button"
            aria-label="Add assignee"
            className="flex size-6 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Plus className="size-3" />
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-0">
        <div className="border-b border-border p-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search members…"
            className="h-7 w-full rounded-md border border-border bg-background px-2 text-xs outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <ul className="max-h-56 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <li className="px-2 py-2 text-xs text-muted-foreground">
              No members
            </li>
          ) : (
            filtered.map((c) => {
              const checked = selectedSet.has(c.id);
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => toggle(c.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted",
                      checked && "bg-muted/60",
                    )}
                  >
                    <Avatar className="size-6">
                      <AvatarImage src={c.avatar ?? undefined} alt={c.name} />
                      <AvatarFallback className="text-[10px] font-semibold">
                        {c.name.charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 truncate">{c.name}</span>
                    {checked && (
                      <span className="text-[10px] font-semibold text-muted-foreground">
                        ✓
                      </span>
                    )}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
};
