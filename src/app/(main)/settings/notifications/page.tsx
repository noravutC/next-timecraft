'use client';

import { Check } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  isFixedKind,
  PREF_KIND_COPY,
  type PrefKind,
} from '@/helper/utils/notification-prefs';
import { isGuestSession } from '@/lib/guest';
import { cn } from '@/lib/utils';
import { SettingsHeading } from '../_components/settings-heading';
import { useNotificationPrefs } from './_components/use-notification-prefs';

// due-date reminders join this list when they're sent
const ROWS: PrefKind[] = [
  'mentions',
  'replies',
  'assigned',
  'invites',
  'roles',
  'accepted',
];

export default function NotificationSettingsPage() {
  const { data: session } = useSession();
  const guest = isGuestSession(session);
  const { prefs, setChannel } = useNotificationPrefs();

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SettingsHeading title="Notifications">
          Choose what shows up in the bell.
        </SettingsHeading>
        {!guest && (
          <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-surface-hover px-2.5 text-xs text-ink-muted">
            <Check className="size-3" />
            Changes save automatically
          </span>
        )}
      </div>

      {guest && (
        <p className="rounded-popover border border-warning-line bg-warning-soft px-4 py-3 text-sm text-warning-text">
          Everyone in the guest demo shares this account, so these settings
          can’t be changed.
        </p>
      )}

      {!prefs ? (
        <Skeleton className="h-96 w-full rounded-popover" />
      ) : (
        <div className="overflow-hidden rounded-popover border border-line">
          <div className="flex h-10 items-center gap-3 border-b border-line bg-surface px-4 text-xs text-ink-subtle">
            <span className="flex-1">When</span>
            <span className="w-20 text-center">In the app</span>
          </div>
          {ROWS.map((kind, index) => {
            const fixed = isFixedKind(kind);
            return (
              <label
                key={kind}
                className={cn(
                  'flex min-h-16 items-center gap-3 px-4 py-3',
                  index > 0 && 'border-t border-line',
                  !fixed && !guest && 'cursor-pointer',
                )}
              >
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-base font-medium text-ink">
                    {PREF_KIND_COPY[kind].label}
                  </span>
                  <span className="text-xs text-ink-subtle">
                    {PREF_KIND_COPY[kind].hint}
                  </span>
                </span>
                <span className="flex w-20 justify-center">
                  <Checkbox
                    aria-label={`${PREF_KIND_COPY[kind].label} in the app`}
                    checked={prefs.kinds[kind].app}
                    disabled={fixed || guest}
                    onCheckedChange={(on) =>
                      void setChannel(kind, 'app', on === true)
                    }
                  />
                </span>
              </label>
            );
          })}
        </div>
      )}
    </>
  );
}
