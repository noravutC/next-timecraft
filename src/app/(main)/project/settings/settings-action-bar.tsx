'use client';

import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// ─── Shared UI ──────────────────────────────────────────────────────────────

/** Inner card used uniformly in every settings section. */
export const SettingsCard = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => (
  <Card className={cn('gap-4 bg-muted/[0.22] shadow-none', className)}>
    {children}
  </Card>
);

// Re-export sub-components so callers don't need a separate Card import.
export { CardHeader as SettingsCardHeader, CardContent as SettingsCardContent };

// ─── Action bar ─────────────────────────────────────────────────────────────

interface SettingsActionBarProps {
  changed: boolean;
  saving: boolean;
  onReset: () => void;
  onSave: () => void;
}

export const SettingsActionBar = ({
  changed,
  saving,
  onReset,
  onSave,
}: SettingsActionBarProps) => (
  <div className="flex flex-col justify-between gap-3 rounded-2xl border bg-muted/30 px-4 py-4 sm:flex-row sm:items-center">
    <div>
      <p className="text-sm font-semibold text-foreground">
        {changed ? 'Unsaved changes' : 'Everything is up to date'}
      </p>
      <p className="text-sm text-muted-foreground">
        Save this section only when you are satisfied with the current edits.
      </p>
    </div>
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={onReset} disabled={!changed || saving}>
        Reset
      </Button>
      <Button onClick={onSave} disabled={!changed || saving}>
        {saving ? 'Saving...' : 'Save changes'}
      </Button>
    </div>
  </div>
);

// ─── Utility ─────────────────────────────────────────────────────────────────

/** Runs `fn`, then shows a success or error toast. */
export async function withToastSave(
  fn: () => Promise<void>,
  successMessage: string,
  errorMessage: string,
) {
  try {
    await fn();
    toast.success(successMessage);
  } catch {
    toast.error(errorMessage);
  }
}
