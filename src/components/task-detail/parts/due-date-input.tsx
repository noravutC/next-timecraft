"use client";

import { CalendarDays, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DueDateInputProps {
  value: Date | null;
  onChange: (next: Date | null) => void;
}

const formatDate = (d: Date) =>
  d.toLocaleDateString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

const relativeLabel = (d: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > 0) return `In ${diffDays} days`;
  return `${Math.abs(diffDays)} days ago`;
};

const toInputValue = (d: Date | null) => {
  if (!d) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export const DueDateInput = ({ value, onChange }: DueDateInputProps) => {
  const overdue = value
    ? new Date(value).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0)
    : false;

  return (
    <div className="space-y-1">
      <div className="relative">
        <CalendarDays className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="date"
          value={toInputValue(value)}
          onChange={(e) =>
            onChange(e.target.value ? new Date(e.target.value) : null)
          }
          className="h-8 w-full rounded-md border border-border bg-background pr-7 pl-7 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Clear due date"
          >
            <X className="size-3" />
          </button>
        )}
      </div>
      {value && (
        <p
          className={cn(
            "text-[11px]",
            overdue ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {formatDate(new Date(value))} · {relativeLabel(new Date(value))}
        </p>
      )}
    </div>
  );
};
