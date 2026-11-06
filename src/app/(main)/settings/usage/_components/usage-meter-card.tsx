import {
  isNearLimit,
  usagePercent,
  type UsageKind,
  type UsageMeter,
} from '@/helper/utils/usage-meters';
import { cn } from '@/lib/utils';

const LABELS: Record<UsageKind, string> = {
  ai: 'AI Breakdown runs',
  boards: 'Boards created',
  invites: 'Invitations sent',
  uploads: 'Comment uploads',
};

const NOTES: Record<UsageKind, string> = {
  ai: 'On TimeCraft’s Claude key. Add your own Claude or Gemini key in AI Breakdown › Settings and this limit no longer applies.',
  boards: 'Counted across every workspace you can create boards in.',
  invites: 'Board and workspace invitations together.',
  uploads: 'Images, videos and files attached to comments.',
};

/** One daily limit: used of total, a bar, and what it counts. */
export const UsageMeterCard = ({
  meter,
  note,
}: {
  meter: UsageMeter;
  /** in place of the usual note, e.g. for your own AI key */
  note?: string;
}) => {
  const near = !note && isNearLimit(meter);
  return (
    <div className="flex flex-col gap-2.5 rounded-popover border border-line p-4">
      <span className="flex items-baseline gap-2">
        <span className="flex-1 text-base font-medium text-ink">
          {LABELS[meter.kind]}
        </span>
        <span className="font-mono text-sm text-ink">
          {meter.used} <span className="text-ink-subtle">/ {meter.limit}</span>
        </span>
      </span>
      <span
        role="meter"
        aria-label={LABELS[meter.kind]}
        aria-valuemin={0}
        aria-valuemax={meter.limit}
        aria-valuenow={Math.min(meter.used, meter.limit)}
        className="block h-1.5 overflow-hidden rounded-full bg-line-soft"
      >
        <span
          className={cn(
            'block h-full rounded-full',
            near ? 'bg-warning' : 'bg-ink',
          )}
          style={{ width: `${usagePercent(meter)}%` }}
        />
      </span>
      <span className="text-xs leading-4.25 text-ink-subtle">
        {near && 'Close to the limit. '}
        {note ?? NOTES[meter.kind]}
      </span>
    </div>
  );
};
