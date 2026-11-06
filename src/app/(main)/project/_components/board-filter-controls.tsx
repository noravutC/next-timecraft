'use client';

import { ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

// ชุด control ของ BoardFilterBar — dropdown, check item, chip ใช้เฉพาะแถบ filter

export const FilterDropdown = ({
  icon: Icon,
  label,
  activeCount,
  disabled,
  children,
}: {
  icon: typeof SlidersHorizontal;
  label: string;
  activeCount: number;
  disabled?: boolean;
  children: React.ReactNode;
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild disabled={disabled}>
      <Button
        variant="outline"
        size="sm"
        className={cn(
          'border-line px-2.5 [&_svg]:text-ink-subtle',
          activeCount > 0 && 'border-ink hover:border-ink',
        )}
      >
        <Icon className="size-3.5" />
        {label}
        {activeCount > 0 && (
          <span className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-ink px-1 text-xs text-white">
            {activeCount}
          </span>
        )}
        <ChevronDown className="size-3.5" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent
      align="start"
      className="max-h-64 min-w-56 overflow-y-auto"
    >
      {children}
    </DropdownMenuContent>
  </DropdownMenu>
);

// item ติ๊กเลือกใน dropdown — ใช้ Checkbox สี่เหลี่ยมแทน check mark ของ
// DropdownMenuCheckboxItem; preventDefault กันเมนูปิดตอนเลือกหลายค่า
export const FilterCheckItem = ({
  checked,
  onToggle,
  children,
}: {
  checked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) => (
  <DropdownMenuItem
    onSelect={(e) => {
      e.preventDefault();
      onToggle();
    }}
    className="gap-2.5"
  >
    <Checkbox
      checked={checked}
      tabIndex={-1}
      // important จำเป็น — DropdownMenuItem บังคับ svg ลูกเป็น text-muted-foreground
      className="pointer-events-none data-[state=checked]:border-ink data-[state=checked]:bg-ink [&_svg]:!text-white"
    />
    {children}
  </DropdownMenuItem>
);

// chip ของค่า filter ที่เลือกแล้ว — ขนาด/ทรงเดียวกับ TagChip size="sm"
export const FilterChip = ({
  label,
  palette,
  dotColor,
  onRemove,
}: {
  label: string;
  palette?: { bg: string; border: string; text: string };
  dotColor?: string;
  onRemove: () => void;
}) => (
  <span
    className={cn(
      'inline-flex h-6.5 items-center gap-1.5 rounded-full border pr-1 pl-2.5 text-xs',
      !palette && 'border-line bg-surface text-ink',
    )}
    style={
      palette
        ? {
            backgroundColor: palette.bg,
            borderColor: palette.border,
            color: palette.text,
          }
        : undefined
    }
  >
    <span
      className={cn(
        'size-2 shrink-0 rounded-full',
        !dotColor && 'bg-ink-faint',
      )}
      style={dotColor ? { backgroundColor: dotColor } : undefined}
    />
    {label}
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Remove ${label}`}
      className="flex size-5 cursor-pointer items-center justify-center rounded-full text-ink-subtle transition-colors hover:bg-surface-active hover:text-ink"
    >
      <X className="size-3" />
    </button>
  </span>
);
