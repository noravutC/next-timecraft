'use client';

import { Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { SERVER_KEY_DAILY_LIMIT } from '@/lib/ai/quota';
import { GUEST_DAILY_QUOTAS } from '@/lib/api/quotas';
import { SettingsHeading } from '../_components/settings-heading';
import { UsageMeterCard } from './_components/usage-meter-card';
import { useDailyUsage } from './_components/use-daily-usage';

const OWN_KEY_NOTE =
  'Runs on your own key aren’t limited. This limit applies again if you remove the key.';
const GUEST_AI_NOTE =
  'On TimeCraft’s Claude key. Sign in with Google to use your own key instead.';

export default function UsageSettingsPage() {
  const { usage, failed } = useDailyUsage();
  const aiNote = usage?.ownAiKey
    ? OWN_KEY_NOTE
    : usage?.guest
      ? GUEST_AI_NOTE
      : undefined;

  return (
    <>
      <SettingsHeading title="Usage & limits">
        Daily limits keep the shared servers healthy. Each one counts your last
        24 hours, so room frees up gradually rather than all at midnight.
      </SettingsHeading>

      <section className="flex flex-col gap-1 rounded-xl border border-line bg-surface p-4.5">
        <span className="flex items-center gap-2">
          <span className="text-copy font-semibold text-ink">Free</span>
          <span className="inline-flex h-5.5 items-center rounded-full border border-line bg-background px-2 text-xs text-ink-muted">
            While in development
          </span>
        </span>
        <span className="text-sm leading-4.75 text-ink-muted">
          Every feature is free right now. Paid plans are planned but not
          switched on, so nothing here will charge you.
        </span>
      </section>

      <section className="flex flex-col gap-2.5">
        <h2 className="text-md font-semibold text-ink">Your last 24 hours</h2>
        {failed ? (
          <p className="rounded-popover border border-line px-4 py-3 text-sm text-ink-muted">
            Couldn’t load your usage. Reload the page to try again.
          </p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(18.75rem,100%),1fr))] gap-3">
            {usage
              ? usage.meters.map((meter) => (
                  <UsageMeterCard
                    key={meter.kind}
                    meter={meter}
                    note={meter.kind === 'ai' ? aiNote : undefined}
                  />
                ))
              : [0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-30 rounded-popover" />
                ))}
          </div>
        )}
      </section>

      <p className="flex items-start gap-2.5 rounded-popover border border-line px-3.5 py-3 text-sm leading-4.75 text-ink-muted">
        <Info className="mt-0.5 size-3.75 shrink-0 text-ink-subtle" />
        <span>
          The guest demo has lower limits, counted per network because every
          guest shares one account: {SERVER_KEY_DAILY_LIMIT.guest.limit} AI
          Breakdown runs and {GUEST_DAILY_QUOTAS.commentUpload.limit} comment
          uploads a day.
        </span>
      </p>
    </>
  );
}
