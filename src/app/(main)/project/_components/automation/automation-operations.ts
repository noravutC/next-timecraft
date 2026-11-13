import {
  ACTOR,
  defaultTrigger,
  webhookEventName,
} from '@/helper/utils/automation';
import { formatRunDay } from '@/helper/utils/automation-schedule';
import {
  ruleSentence,
  thenParts,
  whenParts,
  whenText,
  type RuleNames,
  type RulePart,
} from '@/helper/utils/automation-text';
import { formatRelativePast } from '@/helper/utils/date-format';
import { countOf, weekStartOf } from '@/helper/utils/insights';
import { zonedTimeToUtc } from '@/helper/utils/time-zone';
import type {
  AutomationRule,
  RuleAction,
  RuleDraft,
  RuleCondition,
  RuleTrigger,
  RuleTriggerType,
  TaskPriority,
  TaskTemplate,
  Webhook,
} from '@/types';

export type AutomationSection = 'rules' | 'templates' | 'webhooks' | 'history';

export type { RuleDraft };

/** A board column as the view needs it. */
export type BoardColumn = {
  id: string;
  name: string;
  color: string | null;
  isDone: boolean;
};

/** What the pickers offer and the sentences name. */
export type BoardContext = {
  columns: BoardColumn[];
  members: { id: string; name: string; avatar: string | null }[];
  labels: string[];
  labelColors: Record<string, string>;
  templates: { id: string; title: string }[];
};

/** The open board as the pickers and sentences need it. */
export const boardContext = (args: {
  projectId: string | null;
  columns: {
    id: string;
    projectId: string;
    name: string;
    color: string | null;
    isDone: boolean;
    isDeleted: boolean;
    orderFraction: string;
  }[];
  memberIds: string[];
  users: Record<string, { fullName: string; avatar?: string | null }>;
  labels: string[];
  labelColors: Record<string, string>;
  templates: TaskTemplate[];
}): BoardContext => ({
  columns: args.columns
    .filter((c) => c.projectId === args.projectId && !c.isDeleted)
    .sort((a, b) => (a.orderFraction < b.orderFraction ? -1 : 1))
    .map(({ id, name, color, isDone }) => ({ id, name, color, isDone })),
  // people whose profile has not arrived yet are left out until it does
  members: args.memberIds.flatMap((id) => {
    const user = args.users[id];
    return user
      ? [{ id, name: user.fullName, avatar: user.avatar ?? null }]
      : [];
  }),
  labels: args.labels,
  labelColors: args.labelColors,
  templates: args.templates.map(({ id, title }) => ({ id, title })),
});

export const namesOf = (board: BoardContext): RuleNames => ({
  columns: Object.fromEntries(
    board.columns.map((c) => [c.id, { name: c.name, color: c.color }]),
  ),
  people: Object.fromEntries(board.members.map((m) => [m.id, m.name])),
  templates: Object.fromEntries(board.templates.map((t) => [t.id, t.title])),
});

/** Monday 00:00 of this week in the zone: where "this week" starts. */
export const weekStart = (now: Date, tz: string): Date =>
  zonedTimeToUtc(weekStartOf(now, tz), 0, tz);

export type RuleRowView = {
  id: string;
  trigger: RuleTriggerType;
  tone: 'change' | 'schedule' | 'fix';
  when: RulePart[];
  then: RulePart[];
  /** the whole rule in words, to name its switch */
  sentence: string;
  enabled: boolean;
  /** why it is paused; null when it runs */
  fix: string | null;
  /** "14 runs this week", "Next: Mon, Nov 16" or "Off" */
  meta: string;
};

const metaOf = (rule: AutomationRule, tz: string): string => {
  if (!rule.enabled) return 'Off';
  if (rule.trigger.type === 'schedule') {
    return rule.nextRunAt
      ? `Next: ${formatRunDay(new Date(rule.nextRunAt), tz)}`
      : 'No next time';
  }
  return rule.runsThisWeek > 0
    ? `${countOf(rule.runsThisWeek, 'run')} this week`
    : 'No runs this week';
};

const rowOf = (
  rule: AutomationRule,
  names: RuleNames,
  tz: string,
): RuleRowView => ({
  id: rule.id,
  trigger: rule.trigger.type,
  tone:
    rule.brokenReason && rule.enabled
      ? 'fix'
      : rule.trigger.type === 'schedule'
        ? 'schedule'
        : 'change',
  when: whenParts(rule, names),
  then: thenParts(rule.actions, names),
  sentence: ruleSentence(rule, names),
  enabled: rule.enabled,
  fix: rule.enabled ? rule.brokenReason : null,
  meta: metaOf(rule, tz),
});

/** Rules in two groups: those that wait for a change, and those on a schedule. */
export const ruleGroups = (
  rules: AutomationRule[],
  names: RuleNames,
  tz: string,
): { caption: string; rows: RuleRowView[] }[] => {
  const sorted = [...rules].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  const rows = (schedule: boolean) =>
    sorted
      .filter((r) => (r.trigger.type === 'schedule') === schedule)
      .map((r) => rowOf(r, names, tz));
  return [
    { caption: 'When something happens', rows: rows(false) },
    { caption: 'On a schedule', rows: rows(true) },
  ].filter((group) => group.rows.length > 0);
};

/** "rules ran 37 times." and how many are paused, for the line above the list. */
export const rulesSummary = (
  rules: AutomationRule[],
): { text: string; broken: string | null } => {
  const runs = rules.reduce((sum, r) => sum + r.runsThisWeek, 0);
  const broken = rules.filter((r) => r.enabled && r.brokenReason).length;
  const live = rules.filter((r) => r.enabled).length;
  return {
    text:
      runs > 0
        ? `rules ran ${countOf(runs, 'time')}.`
        : `${countOf(live, 'rule')} ${live === 1 ? 'is' : 'are'} on, and none has run yet.`,
    broken:
      broken > 0
        ? `${countOf(broken, 'rule')} ${broken === 1 ? 'needs' : 'need'} a fix`
        : null,
  };
};

export type RuleIdea = {
  key: string;
  title: string;
  icon: RuleTriggerType;
  draft: RuleDraft;
};

/**
 * Ready-made rules for this board, each one filled in with its columns.
 * An idea the board already has a rule like is left out.
 */
export const ruleIdeas = (
  board: BoardContext,
  rules: AutomationRule[],
): RuleIdea[] => {
  const { columns } = board;
  const first = columns[0];
  const done = columns.find((c) => c.isDone);
  const doneAt = done ? columns.indexOf(done) : -1;
  // the column work passes through last before it is done
  const review = doneAt > 1 ? columns[doneAt - 1] : undefined;
  // where work is picked up: the last column that is none of the above
  const started =
    columns.filter((c) => c !== first && c !== done && c !== review).at(-1) ??
    review;

  const idea = (
    key: string,
    title: string,
    trigger: RuleTrigger | null,
    actions: RuleAction[],
    conditions: RuleCondition[] = [],
  ): RuleIdea[] =>
    trigger
      ? [
          {
            key,
            title,
            icon: trigger.type,
            draft: { trigger, conditions, actions, enabled: true },
          },
        ]
      : [];

  const all = [
    ...idea(
      'subtasks',
      `Move a task to ${review?.name ?? 'the next column'} when its subtasks are done`,
      review ? { type: 'subtasks_done' } : null,
      [{ type: 'move', columnId: review?.id ?? '' }],
    ),
    ...idea(
      'finished',
      'Tell the creator when their task is finished',
      done ? { type: 'task_finished' } : null,
      [{ type: 'notify', to: 'creator' }],
    ),
    ...idea(
      'starter',
      'Assign whoever starts a task',
      started ? { type: 'task_moved', toColumnId: started.id } : null,
      [{ type: 'assign', userId: ACTOR }],
      [{ field: 'assignee', op: 'is_empty' }],
    ),
    ...idea(
      'archive',
      'Archive tasks two weeks after they are finished',
      done ? { type: 'task_idle', days: 14, columnId: done.id } : null,
      [{ type: 'archive' }],
    ),
    ...idea(
      'due',
      'Raise the priority the day before a due date',
      { type: 'due_soon', days: 1 },
      [{ type: 'set_priority', priority: 'high' }],
    ),
    ...idea('repeat', 'Repeat a task every week', defaultTrigger('schedule'), [
      {
        type: 'create_task',
        templateId: board.templates[0]?.id ?? '',
        columnId: first?.id ?? '',
      },
    ]),
  ];
  const has = (idea: RuleIdea) =>
    rules.some(
      (r) =>
        r.trigger.type === idea.draft.trigger.type &&
        r.actions[0]?.type === idea.draft.actions[0]?.type,
    );
  return all.filter((i) => !has(i));
};

export type TemplateCardView = {
  id: string;
  title: string;
  labels: string[];
  priority: TaskPriority;
  subtasks: string;
  due: string;
  assigneeIds: string[];
  /** "Every Monday at 9:00" when a schedule makes it, else how often it was used */
  usage: string;
  repeats: boolean;
};

/** "Due in 2 days", "Due the same day" or "No due date" */
export const dueInText = (days: number | null): string =>
  days === null
    ? 'No due date'
    : days === 0
      ? 'Due the same day'
      : `Due in ${countOf(days, 'day')}`;

export const templateCards = (
  templates: TaskTemplate[],
  rules: AutomationRule[],
  names: RuleNames,
): TemplateCardView[] =>
  [...templates]
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )
    .map((template) => {
      const schedule = rules.find(
        (r) =>
          r.enabled &&
          r.trigger.type === 'schedule' &&
          r.actions.some(
            (a) => a.type === 'create_task' && a.templateId === template.id,
          ),
      );
      return {
        id: template.id,
        title: template.title,
        labels: template.tags,
        priority: template.priority,
        subtasks:
          template.subtasks.length > 0
            ? countOf(template.subtasks.length, 'subtask')
            : 'No subtasks',
        due: dueInText(template.dueInDays),
        assigneeIds: template.assigneeIds,
        usage: schedule
          ? whenText(schedule, names)
          : template.usedCount > 0
            ? `Used ${countOf(template.usedCount, 'time')}`
            : 'Not used yet',
        repeats: Boolean(schedule),
      };
    });

/** The rules that make tasks from this template, in words. */
export const templateUses = (
  templateId: string,
  rules: AutomationRule[],
  names: RuleNames,
  tz: string,
): { ruleId: string; text: string; next: string | null }[] =>
  rules
    .filter((r) =>
      r.actions.some(
        (a) => a.type === 'create_task' && a.templateId === templateId,
      ),
    )
    .map((r) => ({
      ruleId: r.id,
      text: whenText(r, names),
      next:
        r.enabled && r.nextRunAt
          ? `Next: ${formatRunDay(new Date(r.nextRunAt), tz)}`
          : null,
    }));

export type WebhookRowView = {
  id: string;
  name: string;
  url: string;
  events: string[];
  enabled: boolean;
  tone: 'ok' | 'failing' | 'off';
  status: string;
  /** under the status: when it last got through; null while failing */
  sub: string | null;
};

export const webhookRows = (webhooks: Webhook[]): WebhookRowView[] =>
  [...webhooks]
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )
    .map((hook) => {
      const { failed, recent, lastSentAt } = hook.health;
      const failing = hook.enabled && failed > 0;
      return {
        id: hook.id,
        name: hook.name,
        url: hook.url,
        events: hook.events.map(webhookEventName),
        enabled: hook.enabled,
        tone: !hook.enabled ? 'off' : failing ? 'failing' : 'ok',
        status: !hook.enabled
          ? 'Off'
          : failing
            ? `Failing: ${failed} of the last ${recent}`
            : 'Working',
        sub: failing
          ? null
          : lastSentAt
            ? `Last sent ${formatRelativePast(new Date(lastSentAt))}`
            : 'Nothing sent yet',
      };
    });

/** Why a saved rule is paused; null for a new rule or one that runs. */
export const brokenReasonOf = (
  rules: AutomationRule[],
  ruleId: string | null,
): string | null => rules.find((r) => r.id === ruleId)?.brokenReason ?? null;
