'use client';

import { ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

// ชุด control ของ BoardFilterBar — dropdown, check item, chip ใช้เฉพาะแถบ filter

export const FilterDropdown = ({
  icon,
  label,
  title,
  activeCount,
  children,
}: {
  /** ไอคอนหน้า label (14px, สี ink-subtle) */
  icon: React.ReactNode;
  label: string;
  /** หัวเมนู เช่น "Filter by priority" */
  title: string;
  activeCount: number;
  children: React.ReactNode;
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button
        variant="outline"
        size="sm"
        className={cn(
          'gap-1.5 border-line px-2.5 [&_svg]:text-ink-subtle',
          activeCount > 0 && 'border-ink hover:border-ink',
        )}
      >
        {icon}
        {label}
        {activeCount > 0 && <Badge>{activeCount}</Badge>}
        <ChevronDown className="size-3.5" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" className="max-h-80 w-56">
      <div className="px-2 pt-1.5 pb-1 text-xs text-ink-subtle">{title}</div>
      {children}
    </DropdownMenuContent>
  </DropdownMenu>
);

// item ติ๊กเลือกใน dropdown — Checkbox สี่เหลี่ยมแทน check mark ของ
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
    role="menuitemcheckbox"
    aria-checked={checked}
    onSelect={(e) => {
      e.preventDefault();
      onToggle();
    }}
    className="h-8.5"
  >
    <Checkbox
      checked={checked}
      tabIndex={-1}
      aria-hidden
      // important จำเป็น — DropdownMenuItem ย้อมสี svg ลูกเป็น ink-subtle
      className="pointer-events-none [&_svg]:!text-white"
    />
    {children}
  </DropdownMenuItem>
);

/** ข้อความว่างในเมนู filter เมื่อบอร์ดยังไม่มีตัวเลือก */
export const FilterEmpty = ({ children }: { children: React.ReactNode }) => (
  <div className="px-2 pt-1 pb-2 text-sm text-ink-subtle">{children}</div>
);

// chip ของค่า filter ที่เลือกแล้ว
export const FilterChip = ({
  label,
  dotColor,
  onRemove,
}: {
  label: string;
  dotColor?: string;
  onRemove: () => void;
}) => (
  <span className="inline-flex h-6.5 items-center gap-1 rounded-full border border-line bg-surface pr-1 pl-2.5 text-xs text-ink">
    {dotColor && (
      <span
        className="mr-0.5 size-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: dotColor }}
      />
    )}
    {label}
    <Button
      variant="ghost"
      size="icon-xs"
      onClick={onRemove}
      aria-label={`Remove filter ${label}`}
      className="size-5 rounded-full text-ink-subtle hover:bg-surface-active"
    >
      <X className="size-3 stroke-2" />
    </Button>
  </span>
);
