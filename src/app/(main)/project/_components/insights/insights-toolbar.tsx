'use client';

import { SegmentedControl } from '@/components/ui/segmented-control';
import type { InsightWeeks } from '@/helper/utils/insights';
import { BoardViewSwitch } from '../board-view-switch';
import { DigestPopover } from './digest-popover';
import { PERIOD_OPTIONS, WEEKS_OF } from './insights-operations';

/** The Insights toolbar: view, period and the weekly digest. */
export const InsightsToolbar = ({
  projectId,
  weeks,
  onWeeks,
  periodText,
  showControls,
}: {
  projectId: string | null;
  weeks: InsightWeeks;
  onWeeks: (weeks: InsightWeeks) => void;
  /** "Aug 24 to today" */
  periodText: string;
  /** off on a board without a Done column: there is nothing to pick */
  showControls: boolean;
}) => (
  <div className="flex min-h-13 shrink-0 flex-wrap items-center gap-2 border-b border-line bg-background px-5 py-2.25">
    <BoardViewSwitch />
    {showControls && (
      <>
        <span aria-hidden className="mx-1 hidden h-5 w-px bg-line sm:block" />
        <SegmentedControl
          aria-label="Period"
          options={PERIOD_OPTIONS}
          value={`${weeks}`}
          onChange={(value) => onWeeks(WEEKS_OF[value])}
        />
        <span className="text-xs text-ink-subtle">{periodText}</span>
      </>
    )}
    <div className="flex-1" />
    {showControls && projectId && (
      <DigestPopover key={projectId} projectId={projectId} />
    )}
  </div>
);
