'use client';

import * as React from 'react';
import { AlertTriangle, Bell, CheckCircle2, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export type ConfirmDialogVariant =
  | 'destructive'
  | 'warning'
  | 'info'
  | 'success';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant?: ConfirmDialogVariant;
  title: string;
  description?: React.ReactNode;
  primaryLabel: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  /** Type-to-confirm: primary stays disabled until input matches this string. */
  confirmPhrase?: string;
  /** Optional left-aligned tertiary action (e.g. "Save as draft"). */
  tertiary?: { label: string; onClick: () => void };
  /** Show top-right close (X) button. */
  dismissible?: boolean;
  /** Disable primary while async work is in flight. */
  loading?: boolean;
}

const VARIANTS: Record<
  ConfirmDialogVariant,
  {
    Icon: React.ComponentType<{ className?: string }>;
    tile: string;
    primaryVariant: React.ComponentProps<typeof Button>['variant'];
  }
> = {
  destructive: {
    Icon: Trash2,
    tile: 'bg-danger-soft text-danger-text',
    primaryVariant: 'destructive',
  },
  warning: {
    Icon: AlertTriangle,
    tile: 'bg-warning-soft text-warning',
    primaryVariant: 'default',
  },
  info: {
    Icon: Bell,
    tile: 'bg-brand-soft text-brand',
    primaryVariant: 'default',
  },
  success: {
    Icon: CheckCircle2,
    tile: 'bg-success-soft text-success-text',
    primaryVariant: 'default',
  },
};

export const ConfirmDialog = ({
  open,
  onOpenChange,
  variant = 'destructive',
  title,
  description,
  primaryLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  confirmPhrase,
  tertiary,
  dismissible = false,
  loading = false,
}: ConfirmDialogProps) => {
  const [phrase, setPhrase] = React.useState('');

  // clear the typed phrase when the dialog closes (state reset during render,
  // no effect needed)
  const [wasOpen, setWasOpen] = React.useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (!open) setPhrase('');
  }

  const config = VARIANTS[variant];
  const Icon = config.Icon;

  const phraseMatches =
    !confirmPhrase || phrase.trim() === confirmPhrase.trim();
  const primaryDisabled = loading || !phraseMatches;

  const handleConfirm = async () => {
    if (primaryDisabled) return;
    await onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={dismissible} className="sm:max-w-115">
        <div className="flex flex-col gap-4 p-6">
          <span
            className={cn(
              'grid size-9 place-items-center rounded-lg',
              config.tile,
            )}
          >
            <Icon className="size-4.5" />
          </span>
          <div className="flex flex-col gap-1.5">
            <DialogTitle className="text-lg font-semibold tracking-tight text-ink">
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription className="text-base leading-5.5 text-ink-muted">
                {description}
              </DialogDescription>
            )}
          </div>

          {confirmPhrase && (
            <div className="flex flex-col gap-2">
              <label
                htmlFor="confirm-phrase"
                className="text-sm leading-5 text-ink-muted"
              >
                Type{' '}
                <span className="rounded-sm border border-line bg-surface-hover px-1.25 py-px font-mono text-xs text-ink">
                  {confirmPhrase}
                </span>{' '}
                to confirm
              </label>
              <Input
                id="confirm-phrase"
                autoFocus
                autoComplete="off"
                inputSize="lg"
                value={phrase}
                onChange={(e) => setPhrase(e.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter className={cn(tertiary && 'justify-between')}>
          {tertiary && (
            <Button
              type="button"
              variant="link"
              onClick={tertiary.onClick}
              className="px-0 text-ink-subtle"
            >
              {tertiary.label}
            </Button>
          )}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {cancelLabel}
            </Button>
            <Button
              type="button"
              variant={config.primaryVariant}
              onClick={handleConfirm}
              disabled={primaryDisabled}
            >
              {primaryLabel}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
