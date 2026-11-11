import type { InferSelectModel } from 'drizzle-orm';
import type { digestSubscriptionsTable } from '@/db/schema';
import type { InsightWeeks } from '@/helper/utils/insights';
import type { ColumnRow } from './column';
import type { TaskRow } from './task';
import type { User } from './user';

export type DigestSubscriptionRow = InferSelectModel<
  typeof digestSubscriptionsTable
>;

export type InsightsPerson = Pick<User, 'id' | 'fullName' | 'avatar'>;

export type AttentionKind = 'overdue' | 'stuck' | 'blocked' | 'due_soon';

/** An open task that is overdue, stuck or blocked, and why. */
export type AttentionItem = Pick<TaskRow, 'id' | 'title'> & {
  kind: AttentionKind;
  columnName: string;
  /** overdue and due soon: the due date */
  dueDate: string | null;
  /** overdue: whole days past the due day */
  overdueDays: number;
  /** stuck: whole days since it last changed column */
  idleDays: number;
  /** due soon: whole days until the due day (0 = today) */
  dueInDays: number;
  /** blocked: the task it is waiting on */
  waitingOn: string | null;
  assignees: InsightsPerson[];
};

export type InsightsWait = Pick<ColumnRow, 'id' | 'name' | 'color'> & {
  /** average days a finished task spent here */
  days: number;
};

/** A person's share of the board; `person` is null for unassigned tasks. */
export type InsightsWorkload = {
  person: InsightsPerson | null;
  open: number;
  overdue: number;
  done: number;
};

/** POST /api/project/[id]/insights: everything the Insights view shows. */
export type BoardInsights = {
  weeks: InsightWeeks;
  /** without a Done column nothing below is counted */
  hasDoneColumn: boolean;
  /** whether any task on the board is finished, in any period */
  hasFinished: boolean;
  completed: {
    total: number;
    /** the same number of weeks just before this period */
    previous: number;
    /** one per week, oldest first; `start` is that Monday as YYYY-MM-DD */
    byWeek: { start: string; count: number }[];
  };
  /** tasks added to the board, over the same weeks as `completed.byWeek` */
  created: { total: number; byWeek: { start: string; count: number }[] };
  /** median days from created to Done; null when nothing was finished */
  timeToDone: { median: number | null; previousMedian: number | null };
  /** tasks finished in the period that had a due date, and how many met it */
  onTime: { due: number; met: number };
  open: number;
  overdue: number;
  /** open tasks that have not changed column for STUCK_AFTER_DAYS */
  stuck: number;
  waits: InsightsWait[];
  /** how many finished tasks `waits` is averaged over */
  waitTasks: number;
  attention: AttentionItem[];
  /** all tasks that need attention; `attention` holds the first ones */
  attentionTotal: number;
  /** open tasks due within UPCOMING_DAYS, soonest first */
  upcoming: AttentionItem[];
  /** all of them; `upcoming` holds the first ones */
  upcomingTotal: number;
  workload: InsightsWorkload[];
};

/** GET /api/project/[id]/digest: your weekly digest setting for a board. */
export type DigestState = {
  on: boolean;
  /** when the next digest goes out */
  nextAt: string;
  /** all emails are turned off in the person's notification settings */
  emailOff: boolean;
};

/** What one weekly digest email reports about a board. */
export type DigestContents = {
  /** finished last week, and the week before it */
  completed: number;
  previousCompleted: number;
  /** median days from created to Done last week */
  median: number | null;
  /** the latest ones finished last week, with who had them */
  finished: { title: string; by: string | null }[];
  /** open tasks due in the week now starting, and those already overdue */
  dueThisWeek: number;
  overdue: number;
  attention: AttentionItem[];
  attentionTotal: number;
};
