import { UPCOMING_DAYS } from '@/helper/utils/insights';
import type { AttentionItem } from '@/types';
import { moreLine, upcomingRows } from './insights-operations';
import { TaskListCard } from './task-list-card';
import { TaskListRow } from './task-list-row';

/** Open tasks due in the coming days, soonest first; a row opens its task. */
export const UpcomingCard = ({
  items,
  total,
  timeZone,
  onOpen,
}: {
  items: AttentionItem[];
  /** all tasks due in those days; `items` are the first ones */
  total: number;
  /** the zone the due days are shown in */
  timeZone: string;
  onOpen: (taskId: string) => void;
}) => (
  <TaskListCard
    title="Coming up"
    hint={`Due in the next ${UPCOMING_DAYS} days`}
    total={total}
    empty={`Nothing is due in the next ${UPCOMING_DAYS} days.`}
    more={moreLine(total, items.length)}
    className="basis-85"
  >
    {upcomingRows(items, timeZone).map((row) => (
      <TaskListRow
        key={row.id}
        lead={
          <span
            aria-hidden
            className="flex size-9 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border border-line bg-background"
          >
            <span className="text-3xs text-ink-subtle">{row.weekday}</span>
            <span className="text-sm leading-4 font-semibold text-ink tabular-nums">
              {row.day}
            </span>
          </span>
        }
        title={row.title}
        why={row.why}
        owner={row.owner}
        ownerNames={row.ownerNames}
        onOpen={() => onOpen(row.id)}
      />
    ))}
  </TaskListCard>
);
