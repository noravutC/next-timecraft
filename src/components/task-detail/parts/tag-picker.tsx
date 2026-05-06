"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  hashTagColor,
  paletteFor,
} from "@/lib/project-settings/tag-palette";
import type { ProjectSettings } from "@/types/project-settings";
import { cn } from "@/lib/utils";

interface TagPickerProps {
  projectTags: string[];
  selectedTags: string[];
  tagColors: Required<ProjectSettings>["tagColors"];
  onChange: (next: string[]) => void;
  trigger?: React.ReactNode;
}

export const TagPicker = ({
  projectTags,
  selectedTags,
  tagColors,
  onChange,
  trigger,
}: TagPickerProps) => {
  const [query, setQuery] = useState("");
  const selectedSet = useMemo(() => new Set(selectedTags), [selectedTags]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projectTags;
    return projectTags.filter((t) => t.toLowerCase().includes(q));
  }, [query, projectTags]);

  const toggle = (tag: string) => {
    const next = selectedSet.has(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    onChange(next);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        {trigger ?? (
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Plus className="size-3" />
            Add label
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-0">
        <div className="border-b border-border p-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search labels…"
            className="h-7 w-full rounded-md border border-border bg-background px-2 text-xs outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <ul className="max-h-56 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <li className="px-2 py-2 text-xs text-muted-foreground">
              No labels in project
            </li>
          ) : (
            filtered.map((tag) => {
              const palette = paletteFor(tagColors[tag] ?? hashTagColor(tag));
              const checked = selectedSet.has(tag);
              return (
                <li key={tag}>
                  <button
                    type="button"
                    onClick={() => toggle(tag)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted",
                      checked && "bg-muted/60",
                    )}
                  >
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: palette.value }}
                    />
                    <span className="flex-1 truncate" style={{ color: palette.text }}>
                      {tag}
                    </span>
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
