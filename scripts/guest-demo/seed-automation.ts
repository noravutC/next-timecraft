// Rules, templates and a little history for the demo board's Automation
// view. Called by reset-guest-demo.ts inside its transaction, after the
// cards exist.

import { generateNKeysBetween } from 'fractional-indexing';
import { and, eq } from 'drizzle-orm';
import type { db } from '../../src/db';
import * as schema from '../../src/db/schema';
import type { RuleAction, RuleCondition, RuleTrigger } from '../../src/types';
import {
  dueDateIn,
  nextRunAt,
} from '../../src/helper/utils/automation-schedule';
import { whenText } from '../../src/helper/utils/automation-text';
import { shortName } from '../../src/helper/utils/person-name';
import * as demo from './demo-board';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type ColumnRef = { id: string; name: string; color: string | null };
type RuleParts = {
  trigger: RuleTrigger;
  conditions: RuleCondition[];
  actions: RuleAction[];
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export async function seedDemoAutomation(
  tx: Tx,
  ctx: {
    projectId: string;
    guestId: string;
    guestName: string;
    timeZone: string;
    columnRef: (name: string) => ColumnRef;
    taskIdByTitle: Record<string, string>;
    /** the order key of the last card in To do */
    lastTodoKey: string | null;
    now: Date;
    /** midday, `days` from the reset day */
    at: (days: number) => Date;
  },
) {
  const { projectId, guestId, timeZone, columnRef, now } = ctx;
  const column = (name: string) => columnRef(name).id;

  const templates = await tx
    .insert(schema.taskTemplatesTable)
    .values(
      demo.DEMO_TEMPLATES.map((t) => ({
        projectId,
        title: t.title,
        description: t.description,
        priority: t.priority,
        tags: t.labels,
        subtasks: t.subtasks,
        assigneeIds: t.assigned ? [guestId] : [],
        dueInDays: t.dueInDays,
        createdBy: guestId,
      })),
    )
    .returning();
  const repeating = templates.find(
    (t) => t.title === demo.DEMO_REPEATING_TEMPLATE,
  );
  if (!repeating) throw new Error('The repeating template is not seeded');

  const parts: Record<demo.DemoRule['kind'], RuleParts> = {
    review: {
      trigger: { type: 'task_moved', toColumnId: column('Review') },
      conditions: [{ field: 'assignee', op: 'is_empty' }],
      actions: [{ type: 'assign', userId: guestId }],
    },
    subtasks: {
      trigger: { type: 'subtasks_done' },
      conditions: [],
      actions: [{ type: 'move', columnId: column('Review') }],
    },
    finished: {
      trigger: { type: 'task_finished' },
      conditions: [],
      actions: [{ type: 'notify', to: 'creator' }],
    },
    overdue: {
      trigger: { type: 'due_passed' },
      conditions: [],
      actions: [{ type: 'set_priority', priority: 'high' }],
    },
    idle: {
      trigger: { type: 'task_idle', days: 7 },
      conditions: [],
      actions: [{ type: 'comment', body: 'Is this still moving?' }],
    },
    weekly: {
      trigger: {
        type: 'schedule',
        every: 'week',
        weekdays: [1],
        time: '09:00',
      },
      conditions: [],
      actions: [
        {
          type: 'create_task',
          templateId: repeating.id,
          columnId: column('To do'),
        },
      ],
    },
  };
  const names = {
    columns: Object.fromEntries(
      demo.DEMO_COLUMNS.map((c) => [
        column(c.name),
        { name: c.name, color: c.color },
      ]),
    ),
    people: { [guestId]: ctx.guestName },
    templates: Object.fromEntries(templates.map((t) => [t.id, t.title])),
  };

  const rules = await tx
    .insert(schema.automationRulesTable)
    .values(
      demo.DEMO_RULES.map((rule, i) => {
        const { trigger } = parts[rule.kind];
        return {
          projectId,
          ...parts[rule.kind],
          enabled: rule.on,
          createdBy: guestId,
          nextRunAt:
            trigger.type === 'schedule'
              ? nextRunAt(trigger, timeZone, now)
              : null,
          // in the order written, a minute apart
          createdAt: new Date(
            now.getTime() - (demo.DEMO_RULES.length - i) * 60_000,
          ),
        };
      }),
    )
    .returning();
  const ruleOf = (kind: demo.DemoRule['kind']) => {
    const rule = rules[demo.DEMO_RULES.findIndex((r) => r.kind === kind)];
    return { id: rule.id, text: whenText(parts[kind], names) };
  };

  // the Weekly review the schedule made last Monday at 9:00
  const weekly = ruleOf('weekly');
  const schedule = parts.weekly.trigger;
  let madeAt =
    schedule.type === 'schedule'
      ? nextRunAt(schedule, timeZone, new Date(now.getTime() - WEEK_MS))
      : null;
  if (!madeAt) throw new Error('The weekly schedule has no day');
  if (madeAt > now) madeAt = new Date(madeAt.getTime() - WEEK_MS);
  const [made] = await tx
    .insert(schema.tasksTable)
    .values({
      columnId: column('To do'),
      title: repeating.title,
      description: repeating.description,
      priority: repeating.priority,
      tags: repeating.tags,
      dueDate: dueDateIn(repeating.dueInDays ?? 0, timeZone, madeAt),
      orderFraction: generateNKeysBetween(ctx.lastTodoKey, null, 1)[0],
      repeatRuleId: weekly.id,
      createdAt: madeAt,
      updatedAt: madeAt,
    })
    .returning({ id: schema.tasksTable.id });
  const subtaskKeys = generateNKeysBetween(
    null,
    null,
    repeating.subtasks.length,
  );
  await tx.insert(schema.subtasksTable).values(
    repeating.subtasks.map((title, i) => ({
      taskId: made.id,
      title,
      orderFraction: subtaskKeys[i],
    })),
  );
  await tx
    .insert(schema.taskAssigneesTable)
    .values({ taskId: made.id, userId: guestId });

  // what rules did, as the task histories and the History list tell it
  const reviewed = ctx.taskIdByTitle['Realtime presence on cards'];
  const assigned = ctx.taskIdByTitle['Rate limit the AI breakdown endpoint'];
  const subtasks = ruleOf('subtasks');
  const review = ruleOf('review');
  await tx
    .update(schema.taskActivitiesTable)
    .set({
      actorId: null,
      automation: { ruleId: subtasks.id, rule: subtasks.text },
    })
    .where(
      and(
        eq(schema.taskActivitiesTable.taskId, reviewed),
        eq(schema.taskActivitiesTable.type, 'moved'),
      ),
    );
  await tx.insert(schema.taskActivitiesTable).values([
    {
      taskId: made.id,
      actorId: null,
      automation: { ruleId: weekly.id, rule: weekly.text },
      type: 'created' as const,
      data: { column: columnRef('To do') },
      createdAt: madeAt,
    },
    {
      taskId: assigned,
      actorId: null,
      automation: { ruleId: review.id, rule: review.text },
      type: 'assignees_changed' as const,
      data: { added: [{ id: guestId, name: ctx.guestName }], removed: [] },
      createdAt: ctx.at(-8),
    },
  ]);
  await tx.insert(schema.automationRunsTable).values([
    {
      projectId,
      ruleId: weekly.id,
      rule: weekly.text,
      trigger: 'schedule' as const,
      taskId: made.id,
      taskTitle: repeating.title,
      status: 'done' as const,
      detail: `Created ${repeating.title} in To do`,
      createdAt: madeAt,
    },
    {
      projectId,
      ruleId: subtasks.id,
      rule: subtasks.text,
      trigger: 'subtasks_done' as const,
      taskId: reviewed,
      taskTitle: 'Realtime presence on cards',
      status: 'done' as const,
      detail: 'Moved it to Review',
      createdAt: ctx.at(-9),
    },
    {
      projectId,
      ruleId: review.id,
      rule: review.text,
      trigger: 'task_moved' as const,
      taskId: assigned,
      taskTitle: 'Rate limit the AI breakdown endpoint',
      status: 'done' as const,
      detail: `Assigned ${shortName(ctx.guestName)}`,
      createdAt: ctx.at(-8),
    },
  ]);

  return { rules: rules.length, templates: templates.length };
}
