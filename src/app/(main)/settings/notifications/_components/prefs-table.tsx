'use client';

import { Checkbox } from '@/components/ui/checkbox';
import {
  isFixedKind,
  PREF_KIND_COPY,
  PREF_KINDS,
  type Channels,
  type NotificationPrefs,
  type PrefKind,
} from '@/helper/utils/notification-prefs';
import { cn } from '@/lib/utils';

interface PrefsTableProps {
  prefs: NotificationPrefs;
  locked: boolean;
  onChange: (kind: PrefKind, channel: keyof Channels, on: boolean) => void;
}

/** When · In the app · Email, one row per kind. */
export const PrefsTable = ({ prefs, locked, onChange }: PrefsTableProps) => (
  <div className="overflow-hidden rounded-popover border border-line">
    <div className="flex h-10 items-center gap-3 border-b border-line bg-surface px-4 text-xs text-ink-subtle">
      <span className="flex-1">When</span>
      <span className="w-20 text-center">In the app</span>
      <span className="w-16 text-center">Email</span>
    </div>
    {PREF_KINDS.map((kind, index) => {
      const fixed = isFixedKind(kind);
      const copy = PREF_KIND_COPY[kind];
      return (
        <div
          key={kind}
          className={cn(
            'flex min-h-16 items-center gap-3 px-4 py-3',
            index > 0 && 'border-t border-line',
          )}
        >
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-base font-medium text-ink">{copy.label}</span>
            <span className="text-xs text-ink-subtle">{copy.hint}</span>
          </span>
          <span className="flex w-20 justify-center">
            <Checkbox
              aria-label={`${copy.label} in the app`}
              checked={prefs.kinds[kind].app}
              disabled={fixed || locked}
              onCheckedChange={(on) => onChange(kind, 'app', on === true)}
            />
          </span>
          <span className="flex w-16 justify-center">
            {fixed ? (
              <span className="text-xs text-ink-subtle">Always</span>
            ) : (
              <Checkbox
                aria-label={`${copy.label} by email`}
                checked={prefs.email && prefs.kinds[kind].email}
                disabled={!prefs.email || locked}
                onCheckedChange={(on) => onChange(kind, 'email', on === true)}
              />
            )}
          </span>
        </div>
      );
    })}
  </div>
);
