'use client';

import { SegmentedControl } from '@/components/ui/segmented-control';

// value = hours, stored as the option key
const ESTIMATE_OPTIONS = [
  { value: '1', label: '1h' },
  { value: '2', label: '2h' },
  { value: '4', label: '4h' },
  { value: '8', label: '1d' },
  { value: '16', label: '2d' },
  { value: '40', label: '1w' },
];

interface EstimatePickerProps {
  /** hours; 0 = no estimate */
  value: number;
  onChange: (next: number) => void;
}

/** 1h … 1w; picking the current value again clears it. */
export const EstimatePicker = ({ value, onChange }: EstimatePickerProps) => (
  <SegmentedControl
    aria-label="Estimate"
    options={ESTIMATE_OPTIONS}
    value={value ? String(value) : null}
    onChange={(next) => onChange(Number(next) === value ? 0 : Number(next))}
    optionClassName="h-6.5 min-w-9.5 px-2 font-mono text-xs font-normal"
  />
);
