'use client';

import { Clock } from 'lucide-react';
import { formatDuration, spentPercent } from '@/helper/utils/duration';
import { formatEstimate } from '@/helper/utils/task-activity-view';
import { LogTimePopover } from './log-time-popover';
import { PropertyRow } from './property-row';

/** Time spent so far, against the estimate when there is one. */
export const TimeSpentRow = ({
  taskId,
  minutes,
  estimateHours,
  readOnly,
}: {
  taskId: string;
  minutes: number;
  estimateHours: number;
  readOnly: boolean;
}) => (
  <PropertyRow icon={<Clock />} label="Time spent">
    <div className="flex flex-wrap items-center gap-2.5 py-0.75">
      <span className="pl-2 font-mono text-xs text-ink">
        {formatDuration(minutes)}
      </span>
      {estimateHours > 0 && (
        <>
          <span
            aria-hidden
            className="h-1 w-30 overflow-hidden rounded-full bg-line-soft"
          >
            <span
              className="block h-full rounded-full bg-ink"
              style={{ width: `${spentPercent(minutes, estimateHours)}%` }}
            />
          </span>
          <span className="text-xs text-ink-subtle">
            of a {formatEstimate(estimateHours)} estimate
          </span>
        </>
      )}
      {!readOnly && <LogTimePopover taskId={taskId} />}
    </div>
  </PropertyRow>
);
