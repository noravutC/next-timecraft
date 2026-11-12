import { db } from '@/db';
import {
  columnsTable,
  taskActivitiesTable,
  taskAssigneesTable,
  taskDependenciesTable,
  tasksTable,
  usersTable,
} from '@/db/schema';
import { fetchAssigneesForTasks } from '@/db/uniq-query/task/assignee-utils';
import {
  insightsPeriod,
  STUCK_AFTER_DAYS,
  type InsightWeeks,
} from '@/helper/utils/insights';
import type {
  AttentionItem,
  AttentionKind,
  BoardInsights,
  InsightsPerson,
  InsightsWait,
  InsightsWorkload,
} from '@/types';
import { and, eq, sql } from 'drizzle-orm';

/** How many rows "Needs attention" and "Coming up" list (all are counted). */
export const ATTENTION_LIMIT = 8;

const SECONDS_PER_DAY = 86_400;
const MS_PER_DAY = SECONDS_PER_DAY * 1000;

const stamp = (at: Date) => sql`${at.toISOString()}::timestamptz`;
const toDays = (seconds: number | null) =>
  seconds === null ? null : seconds / SECONDS_PER_DAY;

/** A board's live columns in board order: the Done one and the rest. */
export async function getBoardLanes(projectId: string) {
  const columns = await db
    .select({
      id: columnsTable.id,
      name: columnsTable.name,
      color: columnsTable.color,
      isDone: columnsTable.isDone,
    })
    .from(columnsTable)
    .where(
      and(
        eq(columnsTable.projectId, projectId),
        eq(columnsTable.isDeleted, false),
      ),
    )
    .orderBy(sql`${columnsTable.orderFraction} COLLATE "C" asc`);
  return {
    done: columns.find((c) => c.isDone) ?? null,
    open: columns.filter((c) => !c.isDone),
  };
}

/**
 * Tasks finished from `from` up to `to`, the count in the stretch before
 * (`previousFrom` to `from`), and the median time from created to Done in
 * each. Also how many of them had a due date and met it: finished on the
 * due day or before, as `tz` counts days. Archived tasks count: archiving
 * finished work doesn't undo it.
 */
export async function completionSummary(
  doneColumnId: string,
  range: { previousFrom: Date; from: Date; to: Date },
  tz: string,
) {
  const inPeriod = sql`completed_at >= ${stamp(range.from)}`;
  const before = sql`completed_at < ${stamp(range.from)}`;
  const taken = sql`extract(epoch from completed_at - created_at)`;
  const hadDue = sql`${inPeriod} and due_date is not null`;
  const metDue = sql`(completed_at at time zone ${tz})::date
    <= (due_date at time zone ${tz})::date`;
  const [row] = await db.execute<{
    total: number;
    previous: number;
    median: number | null;
    previous_median: number | null;
    due: number;
    met: number;
  }>(sql`
    select
      count(*) filter (where ${inPeriod})::int as total,
      count(*) filter (where ${before})::int as previous,
      count(*) filter (where ${hadDue})::int as due,
      count(*) filter (where ${hadDue} and ${metDue})::int as met,
      (percentile_cont(0.5) within group (order by ${taken})
        filter (where ${inPeriod}))::float8 as median,
      (percentile_cont(0.5) within group (order by ${taken})
        filter (where ${before}))::float8 as previous_median
    from ${tasksTable}
    where column_id = ${doneColumnId}
      and completed_at >= ${stamp(range.previousFrom)}
      and completed_at < ${stamp(range.to)}
  `);
  return {
    total: row?.total ?? 0,
    previous: row?.previous ?? 0,
    median: toDays(row?.median ?? null),
    previousMedian: toDays(row?.previous_median ?? null),
    due: row?.due ?? 0,
    met: row?.met ?? 0,
  };
}

/** Finished tasks per week (keyed by that week's Monday, in the zone). */
async function completedByWeek(
  doneColumnId: string,
  from: Date,
  tz: string,
): Promise<Map<string, number>> {
  const rows = await db.execute<{ week: string; n: number }>(sql`
    select
      to_char(date_trunc('week', completed_at at time zone ${tz}), 'YYYY-MM-DD') as week,
      count(*)::int as n
    from ${tasksTable}
    where column_id = ${doneColumnId} and completed_at >= ${stamp(from)}
    group by 1
  `);
  return new Map(rows.map((r) => [r.week, r.n]));
}

/**
 * Tasks added to the board per week, keyed like `completedByWeek`. Every
 * task counts, whatever became of it since: finished, archived or still open.
 */
async function createdByWeek(
  projectId: string,
  range: { from: Date; to: Date },
  tz: string,
): Promise<Map<string, number>> {
  const rows = await db.execute<{ week: string; n: number }>(sql`
    select
      to_char(date_trunc('week', t.created_at at time zone ${tz}), 'YYYY-MM-DD') as week,
      count(*)::int as n
    from ${tasksTable} t
    join ${columnsTable} c on c.id = t.column_id
    where c.project_id = ${projectId} and not c.is_deleted
      and t.created_at >= ${stamp(range.from)}
      and t.created_at < ${stamp(range.to)}
    group by 1
  `);
  return new Map(rows.map((r) => [r.week, r.n]));
}

/** Open tasks on the board: how many, how many overdue, how many unassigned. */
export async function openCounts(projectId: string, today: Date) {
  const overdue = sql`t.due_date < ${stamp(today)}`;
  const unassigned = sql`not exists (
    select 1 from ${taskAssigneesTable} ta where ta.task_id = t.id)`;
  const [row] = await db.execute<{
    open: number;
    overdue: number;
    unassigned: number;
    unassigned_overdue: number;
  }>(sql`
    select
      count(*)::int as open,
      count(*) filter (where ${overdue})::int as overdue,
      count(*) filter (where ${unassigned})::int as unassigned,
      count(*) filter (where ${overdue} and ${unassigned})::int as unassigned_overdue
    from ${tasksTable} t
    join ${columnsTable} c on c.id = t.column_id
    where c.project_id = ${projectId}
      and not c.is_deleted and not c.is_done and not t.archived
  `);
  return {
    open: row?.open ?? 0,
    overdue: row?.overdue ?? 0,
    unassigned: row?.unassigned ?? 0,
    unassignedOverdue: row?.unassigned_overdue ?? 0,
  };
}

type AttentionRow = {
  id: string;
  title: string;
  kind: AttentionKind;
  column_name: string;
  due_date: string | null;
  overdue_days: number | null;
  idle_days: number | null;
  due_in_days?: number | null;
  waiting_on: string | null;
  total: number;
  stuck?: number;
};

const withAssignees = async (
  rows: AttentionRow[],
): Promise<AttentionItem[]> => {
  const people = new Map<string, InsightsPerson[]>();
  for (const a of await fetchAssigneesForTasks(rows.map((r) => r.id))) {
    people.set(a.taskId, [
      ...(people.get(a.taskId) ?? []),
      { id: a.userId, fullName: a.fullName, avatar: a.avatar },
    ]);
  }
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    kind: r.kind,
    columnName: r.column_name,
    dueDate: r.due_date,
    overdueDays: r.overdue_days ?? 0,
    idleDays: r.idle_days ?? 0,
    dueInDays: r.due_in_days ?? 0,
    waitingOn: r.waiting_on ?? null,
    assignees: people.get(r.id) ?? [],
  }));
};

const isoDue = sql`to_char(o.due_date at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`;

/**
 * Open tasks that are overdue, blocked or stuck right now, worst first, and
 * how many there are in all. A task is listed once, under the first of those
 * that applies. Stuck: out of the first column and not moved for a week;
 * `stuck` counts every such task, whatever it is listed under.
 */
export async function listAttention(args: {
  projectId: string;
  doneColumnId: string;
  /** stuck doesn't apply here: a backlog is where tasks wait */
  firstColumnId: string | null;
  now: Date;
  /** midnight today in the zone the days are counted in */
  today: Date;
  tz: string;
  limit: number;
}): Promise<{ items: AttentionItem[]; total: number; stuck: number }> {
  const { projectId, doneColumnId, now, tz } = args;
  const today = stamp(args.today);
  const cutoff = stamp(new Date(now.getTime() - STUCK_AFTER_DAYS * MS_PER_DAY));
  const rows = await db.execute<AttentionRow>(sql`
    with open as (
      select t.id, t.title, t.column_id, t.due_date, t.created_at,
        c.name as column_name
      from ${tasksTable} t
      join ${columnsTable} c on c.id = t.column_id
      where c.project_id = ${projectId}
        and not c.is_deleted and not c.is_done and not t.archived
    ),
    moved as (
      select o.id, coalesce(max(a.created_at), o.created_at) as since
      from open o
      left join ${taskActivitiesTable} a
        on a.task_id = o.id and a.type = 'moved'
      where o.column_id is distinct from ${args.firstColumnId}::uuid
        and o.created_at < ${cutoff}
      group by o.id, o.created_at
    ),
    blocked as (
      select distinct on (d.task_id) d.task_id, b.title as waiting_on
      from ${taskDependenciesTable} d
      join open o on o.id = d.task_id
      join ${tasksTable} b on b.id = d.depends_on_task_id
      where not b.archived and b.column_id <> ${doneColumnId}
      order by d.task_id, d.created_at
    ),
    flagged as (
      select o.*, m.since, bl.waiting_on,
        case
          when o.due_date < ${today} then 'overdue'
          when bl.task_id is not null then 'blocked'
          when m.since < ${cutoff} then 'stuck'
        end as kind
      from open o
      left join moved m on m.id = o.id
      left join blocked bl on bl.task_id = o.id
    )
    select o.id, o.title, o.kind, o.column_name, o.waiting_on,
      ${isoDue} as due_date,
      ((${today} at time zone ${tz})::date
        - (o.due_date at time zone ${tz})::date)::int as overdue_days,
      floor(extract(epoch from ${stamp(now)} - o.since) / 86400)::int as idle_days,
      (count(*) over ())::int as total,
      (count(*) filter (where o.since < ${cutoff}) over ())::int as stuck
    from flagged o
    where o.kind is not null
    order by
      case o.kind when 'overdue' then 0 when 'stuck' then 1 else 2 end,
      case when o.kind = 'overdue' then o.due_date end asc nulls last,
      o.since asc nulls last,
      o.title
    limit ${args.limit}
  `);
  return {
    items: await withAssignees([...rows]),
    total: rows[0]?.total ?? 0,
    stuck: rows[0]?.stuck ?? 0,
  };
}

/**
 * Open tasks due from `from` up to `to`, soonest first, and their count.
 * Each says how many days away its due day is, counted from `today` in `tz`.
 */
export async function listDueSoon(args: {
  projectId: string;
  from: Date;
  to: Date;
  /** midnight today in the zone the days are counted in */
  today: Date;
  tz: string;
  limit: number;
}): Promise<{ items: AttentionItem[]; total: number }> {
  const { tz } = args;
  const rows = await db.execute<AttentionRow>(sql`
    select o.id, o.title, 'due_soon' as kind, c.name as column_name,
      ${isoDue} as due_date,
      ((o.due_date at time zone ${tz})::date
        - (${stamp(args.today)} at time zone ${tz})::date)::int as due_in_days,
      (count(*) over ())::int as total
    from ${tasksTable} o
    join ${columnsTable} c on c.id = o.column_id
    where c.project_id = ${args.projectId}
      and not c.is_deleted and not c.is_done and not o.archived
      and o.due_date >= ${stamp(args.from)} and o.due_date < ${stamp(args.to)}
    order by o.due_date, o.title
    limit ${args.limit}
  `);
  return { items: await withAssignees([...rows]), total: rows[0]?.total ?? 0 };
}

/**
 * Average days a finished task spent in each open column, from its history
 * of moves. Averaged over every task finished since `from` that has a
 * history, so a column most tasks skip shows a small number.
 */
async function columnWaits(
  doneColumnId: string,
  from: Date,
  columns: { id: string; name: string; color: string }[],
): Promise<{ waits: InsightsWait[]; tasks: number }> {
  const rows = await db.execute<{
    column_id: string;
    seconds: number;
    tasks: number;
  }>(sql`
    with steps as (
      select a.task_id,
        coalesce(a.data->'to'->>'id', a.data->'column'->>'id') as column_id,
        a.created_at as entered,
        lead(a.created_at) over (
          partition by a.task_id order by a.created_at, a.id
        ) as left_at
      from ${taskActivitiesTable} a
      join ${tasksTable} t on t.id = a.task_id
      where t.column_id = ${doneColumnId}
        and t.completed_at >= ${stamp(from)}
        and a.type in ('created', 'moved')
    )
    select column_id,
      sum(extract(epoch from left_at - entered))::float8 as seconds,
      (select count(distinct task_id) from steps
        where left_at is not null)::int as tasks
    from steps
    where left_at is not null and column_id is not null
    group by column_id
  `);
  const tasks = rows[0]?.tasks ?? 0;
  const seconds = new Map(rows.map((r) => [r.column_id, r.seconds]));
  return {
    tasks,
    waits: columns.map(({ id, name, color }) => ({
      id,
      name,
      color,
      days: tasks ? (seconds.get(id) ?? 0) / tasks / SECONDS_PER_DAY : 0,
    })),
  };
}

/** Each assignee's open, overdue and finished-since-`from` tasks. */
async function workloadByPerson(
  projectId: string,
  from: Date,
  today: Date,
): Promise<InsightsWorkload[]> {
  const rows = await db.execute<{
    id: string;
    full_name: string;
    avatar: string | null;
    open: number;
    overdue: number;
    done: number;
  }>(sql`
    select u.id, u.full_name, u.avatar,
      count(*) filter (where not c.is_done)::int as open,
      count(*) filter (
        where not c.is_done and t.due_date < ${stamp(today)})::int as overdue,
      count(*) filter (where c.is_done)::int as done
    from ${taskAssigneesTable} ta
    join ${tasksTable} t on t.id = ta.task_id
    join ${columnsTable} c on c.id = t.column_id
    join ${usersTable} u on u.id = ta.user_id
    where c.project_id = ${projectId} and not c.is_deleted
      and (
        (not c.is_done and not t.archived)
        or (c.is_done and t.completed_at >= ${stamp(from)})
      )
    group by u.id
    order by 4 desc, 6 desc, u.full_name
  `);
  return rows.map((r) => ({
    person: { id: r.id, fullName: r.full_name, avatar: r.avatar },
    open: r.open,
    overdue: r.overdue,
    done: r.done,
  }));
}

const EMPTY = {
  hasFinished: false,
  completed: { total: 0, previous: 0, byWeek: [] },
  created: { total: 0, byWeek: [] },
  timeToDone: { median: null, previousMedian: null },
  onTime: { due: 0, met: 0 },
  open: 0,
  overdue: 0,
  stuck: 0,
  waits: [],
  waitTasks: 0,
  attention: [],
  attentionTotal: 0,
  upcoming: [],
  upcomingTotal: 0,
  workload: [],
};

/** Everything the Insights view shows for a board, counted in `tz`. */
export async function getBoardInsights(args: {
  projectId: string;
  weeks: InsightWeeks;
  tz: string;
  now?: Date;
}): Promise<BoardInsights> {
  const { projectId, weeks, tz } = args;
  const now = args.now ?? new Date();
  const lanes = await getBoardLanes(projectId);
  if (!lanes.done) return { weeks, hasDoneColumn: false, ...EMPTY };

  const doneColumnId = lanes.done.id;
  const period = insightsPeriod(now, weeks, tz);
  const [
    summary,
    byWeek,
    newByWeek,
    counts,
    attention,
    upcoming,
    waits,
    workload,
    anyFinished,
  ] = await Promise.all([
    completionSummary(doneColumnId, { ...period, to: now }, tz),
    completedByWeek(doneColumnId, period.from, tz),
    createdByWeek(projectId, { from: period.from, to: now }, tz),
    openCounts(projectId, period.today),
    listAttention({
      projectId,
      doneColumnId,
      firstColumnId: lanes.open[0]?.id ?? null,
      now,
      today: period.today,
      tz,
      limit: ATTENTION_LIMIT,
    }),
    listDueSoon({
      projectId,
      from: period.today,
      to: period.soon,
      today: period.today,
      tz,
      limit: ATTENTION_LIMIT,
    }),
    columnWaits(doneColumnId, period.from, lanes.open),
    workloadByPerson(projectId, period.from, period.today),
    db
      .select({ id: tasksTable.id })
      .from(tasksTable)
      .where(eq(tasksTable.columnId, doneColumnId))
      .limit(1),
  ]);
  const weekly = (perWeek: Map<string, number>) =>
    period.weekKeys.map((start) => ({ start, count: perWeek.get(start) ?? 0 }));
  const added = weekly(newByWeek);

  return {
    weeks,
    hasDoneColumn: true,
    hasFinished: anyFinished.length > 0,
    completed: {
      total: summary.total,
      previous: summary.previous,
      byWeek: weekly(byWeek),
    },
    created: {
      total: added.reduce((sum, week) => sum + week.count, 0),
      byWeek: added,
    },
    timeToDone: {
      median: summary.median,
      previousMedian: summary.previousMedian,
    },
    onTime: { due: summary.due, met: summary.met },
    open: counts.open,
    overdue: counts.overdue,
    stuck: attention.stuck,
    waits: waits.waits,
    waitTasks: waits.tasks,
    attention: attention.items,
    attentionTotal: attention.total,
    upcoming: upcoming.items,
    upcomingTotal: upcoming.total,
    workload: counts.unassigned
      ? [
          ...workload,
          {
            person: null,
            open: counts.unassigned,
            overdue: counts.unassignedOverdue,
            done: 0,
          },
        ]
      : workload,
  };
}
