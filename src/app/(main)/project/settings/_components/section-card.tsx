'use client';

import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SectionCardProps {
  icon: LucideIcon;
  title: string;
  hint?: string;
  action?: React.ReactNode;
  tone?: 'default' | 'danger';
  children: React.ReactNode;
}

export const SectionCard = ({
  icon: Icon,
  title,
  hint,
  action,
  tone = 'default',
  children,
}: SectionCardProps) => (
  <section
    className={cn(
      'rounded-xl border bg-card p-4 shadow-sm',
      tone === 'danger'
        ? 'border-destructive/30 bg-destructive/[0.03]'
        : 'border-border',
    )}
  >
    <div className="mb-3 flex items-start gap-3">
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-lg',
          tone === 'danger'
            ? 'bg-destructive/10 text-destructive'
            : 'bg-muted/60 text-foreground',
        )}
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'text-sm font-semibold leading-tight',
            tone === 'danger' && 'text-destructive',
          )}
        >
          {title}
        </p>
        {hint && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
    {children}
  </section>
);

export const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm font-semibold text-foreground">{children}</p>
);

export const SettingSwitch = ({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => onChange(!checked)}
    className={cn(
      'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
      checked ? 'bg-blue-500' : 'bg-muted-foreground/25',
    )}
  >
    <motion.span
      animate={{ x: checked ? 18 : 2 }}
      transition={{ type: 'spring', stiffness: 600, damping: 36 }}
      className="inline-block size-4 rounded-full bg-white shadow-sm"
    />
  </button>
);
