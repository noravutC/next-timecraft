"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface MentionCandidate {
  id: string;
  name: string;
  avatar: string | null;
}

interface MentionDropdownProps {
  candidates: MentionCandidate[];
  activeIndex: number;
  onSelect: (c: MentionCandidate) => void;
  onHover: (index: number) => void;
}

export const MentionDropdown = ({
  candidates,
  activeIndex,
  onSelect,
  onHover,
}: MentionDropdownProps) => {
  if (candidates.length === 0) return null;
  return (
    <div className="absolute bottom-full left-0 z-20 mb-1 w-64 overflow-hidden rounded-lg border border-border bg-popover shadow-md">
      <ul className="max-h-56 overflow-y-auto py-1">
        {candidates.map((c, i) => {
          const active = i === activeIndex;
          return (
            <li key={c.id}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect(c);
                }}
                onMouseEnter={() => onHover(i)}
                className={cn(
                  "flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-sm",
                  active ? "bg-muted" : "hover:bg-muted/60",
                )}
              >
                <Avatar className="size-6">
                  <AvatarImage src={c.avatar ?? undefined} alt={c.name} />
                  <AvatarFallback className="text-[10px] font-semibold">
                    {c.name.charAt(0).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{c.name}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
