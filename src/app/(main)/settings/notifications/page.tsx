'use client';

import Link from 'next/link';
import { Check, Clock, Mail } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useWorkspace } from '@/components/workspace/use-workspace-name';
import { timeZoneLabel } from '@/helper/utils/time-zone';
import { isGuestSession } from '@/lib/guest';
import { SettingsHeading } from '../_components/settings-heading';
import { PrefsTable } from './_components/prefs-table';
import { useNotificationPrefs } from './_components/use-notification-prefs';

export default function NotificationSettingsPage() {
  const { data: session } = useSession();
  const guest = isGuestSession(session);
  const workspace = useWorkspace();
  const { prefs, setChannel, setEmail } = useNotificationPrefs();

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SettingsHeading title="Notifications">
          Choose what reaches you, and where.
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
          can’t be changed and no emails go out.
        </p>
      )}

      {!prefs ? (
        <Skeleton className="h-96 w-full rounded-popover" />
      ) : (
        <>
          <label className="flex items-center gap-3 rounded-popover border border-line px-4 py-3.5">
            <Mail className="size-4 shrink-0 text-ink-subtle" />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-base font-medium text-ink">
                Email notifications
              </span>
              <span className="text-sm text-ink-subtle">
                Sent to {session?.user?.email}. Turn this off to keep everything
                in the bell.
              </span>
            </span>
            <Switch
              checked={prefs.email}
              disabled={guest}
              onCheckedChange={(on) => void setEmail(on)}
              aria-label="Email notifications"
            />
          </label>
          <PrefsTable
            prefs={prefs}
            locked={guest}
            onChange={(kind, channel, on) => void setChannel(kind, channel, on)}
          />
          <p className="flex items-start gap-2 text-sm text-ink-subtle">
            <Clock className="mt-0.5 size-3.75 shrink-0" />
            <span>
              Due date reminders go out at 9:00 AM in the workspace time zone
              {workspace ? `, ${timeZoneLabel(workspace.timeZone)}` : ''}.
              {workspace && (
                <>
                  {' '}
                  Change it in{' '}
                  <Link
                    href="/settings/workspace"
                    className="text-ink-muted underline underline-offset-2"
                  >
                    Workspace › General
                  </Link>
                  .
                </>
              )}
            </span>
          </p>
        </>
      )}
    </>
  );
}
