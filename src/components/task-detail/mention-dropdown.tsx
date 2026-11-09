"use client";

import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/people/user-avatar";

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
    <div
      role="listbox"
      aria-label="Mention a member"
      className="absolute bottom-full left-0 z-20 mb-1.5 w-64 overflow-hidden rounded-popover border border-line bg-popover p-1 shadow-popover"
    >
      <ul className="max-h-56 overflow-y-auto">
        {candidates.map((c, i) => {
          const active = i === activeIndex;
          return (
            <li key={c.id} role="option" aria-selected={active}>
              {/* mouse down (not click) keeps focus in the composer */}
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect(c);
                }}
                onMouseEnter={() => onHover(i)}
                className={cn(
                  "flex h-8 w-full cursor-pointer items-center gap-2.5 rounded-md px-2 text-left text-sm text-ink",
                  active && "bg-surface-hover",
                )}
              >
                <UserAvatar name={c.name} image={c.avatar} seed={c.id} size="xs" />
                <span className="truncate">{c.name}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
