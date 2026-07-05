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
  <div className="flex w-fit items-center gap-1.5">
    {OPTIONS.map((opt) => {
      const active = value === opt.hours;
      return (
        <button
          key={opt.label}
          type="button"
          onClick={() => onChange(active ? 0 : opt.hours)}
          className={cn(
            "h-7 cursor-pointer rounded-md border px-3 text-xs font-medium transition-colors",
            active
              ? "border-brand bg-brand text-white"
              : "border-line bg-background text-ink-subtle hover:bg-surface-hover hover:text-ink",
          )}
        >
          {opt.label}
        </button>
      );
    })}
  </div>
);
