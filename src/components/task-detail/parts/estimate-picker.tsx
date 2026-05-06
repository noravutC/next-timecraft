"use client";

import { cn } from "@/lib/utils";

interface Option {
  label: string;
  hours: number;
}

const OPTIONS: Option[] = [
  { label: "1h", hours: 1 },
  { label: "2h", hours: 2 },
  { label: "4h", hours: 4 },
  { label: "1d", hours: 8 },
  { label: "2d", hours: 16 },
  { label: "1w", hours: 40 },
];

interface EstimatePickerProps {
  value: number;
  onChange: (next: number) => void;
}

export const EstimatePicker = ({ value, onChange }: EstimatePickerProps) => (
  <div className="grid w-fit grid-cols-3 gap-1.5">
    {OPTIONS.map((opt) => {
      const active = value === opt.hours;
      return (
        <button
          key={opt.label}
          type="button"
          onClick={() => onChange(active ? 0 : opt.hours)}
          className={cn(
            "h-7 rounded-md border px-3 text-xs transition-colors",
            active
              ? "border-foreground bg-foreground text-background"
              : "border-border bg-background hover:bg-muted",
          )}
        >
          {opt.label}
        </button>
      );
    })}
  </div>
);
