import { z } from 'zod';
import {
  ACTOR,
  MAX_RULE_ACTIONS,
  MAX_RULE_CONDITIONS,
  MAX_TEMPLATE_SUBTASKS,
  triggerHasActor,
} from '@/helper/utils/automation';
import {
  MAX_MONTH_DAY,
  SCHEDULE_TIMES,
} from '@/helper/utils/automation-schedule';
import {
  MAX_TASK_DESCRIPTION_LEN,
  MAX_TASK_TITLE_LEN,
} from './task.validation';

const id = z.guid();
const priority = z.enum(['low', 'medium', 'high']);
const label = z.string().trim().min(1).max(64);

const trigger = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('task_created'), columnId: id.optional() }),
  z.strictObject({
    type: z.literal('task_moved'),
    fromColumnId: id.optional(),
    toColumnId: id.optional(),
  }),
  z.strictObject({ type: z.literal('task_finished') }),
  z.strictObject({ type: z.literal('task_assigned'), userId: id.optional() }),
  z.strictObject({ type: z.literal('label_added'), label: label.optional() }),
  z.strictObject({ type: z.literal('subtasks_done') }),
  z.strictObject({
    type: z.literal('due_soon'),
    days: z.number().int().min(1).max(30),
  }),
  z.strictObject({ type: z.literal('due_passed') }),
  z.strictObject({
    type: z.literal('task_idle'),
    days: z.number().int().min(1).max(365),
    columnId: id.optional(),
  }),
  z.strictObject({
    type: z.literal('schedule'),
    every: z.enum(['day', 'week', 'month']),
    weekdays: z.array(z.number().int().min(0).max(6)).max(7).optional(),
    monthDay: z.number().int().min(1).max(MAX_MONTH_DAY).optional(),
    time: z
      .string()
      .refine((time) => SCHEDULE_TIMES.includes(time), 'Pick a time'),
  }),
]);

const condition = z.discriminatedUnion('field', [
  z.strictObject({
    field: z.literal('assignee'),
    op: z.enum(['is_empty', 'is_not_empty']),
  }),
  z.strictObject({
    field: z.literal('priority'),
    op: z.enum(['is', 'is_not']),
    value: priority,
  }),
  z.strictObject({
    field: z.literal('label'),
    op: z.enum(['has', 'has_not']),
    value: label,
  }),
  z.strictObject({
    field: z.literal('column'),
    op: z.enum(['is', 'is_not']),
    value: id,
  }),
]);

const action = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('move'), columnId: id }),
  z.strictObject({
    type: z.literal('assign'),
    userId: z.union([id, z.literal(ACTOR)]),
  }),
  z.strictObject({ type: z.literal('set_priority'), priority }),
  z.strictObject({
    type: z.literal('set_due'),
    days: z.number().int().min(0).max(365),
  }),
  z.strictObject({ type: z.literal('add_label'), label }),
  z.strictObject({ type: z.literal('remove_label'), label }),
  z.strictObject({
    type: z.literal('comment'),
    body: z.string().trim().min(1).max(2000),
  }),
  z.strictObject({
    type: z.literal('notify'),
    to: z.union([id, z.enum(['creator', 'assignees'])]),
  }),
  z.strictObject({
    type: z.literal('create_task'),
    templateId: id,
    columnId: id,
  }),
  z.strictObject({ type: z.literal('archive') }),
]);

export const saveRuleSchema = z
  .strictObject({
    trigger,
    conditions: z.array(condition).max(MAX_RULE_CONDITIONS),
    actions: z.array(action).min(1).max(MAX_RULE_ACTIONS),
    enabled: z.boolean().optional(),
  })
  .superRefine((rule, ctx) => {
    const { trigger: t } = rule;
    const fail = (message: string) => ctx.addIssue({ code: 'custom', message });
    if (t.type === 'schedule') {
      if (t.every === 'week' && !t.weekdays?.length) fail('Pick a day');
      if (t.every === 'month' && !t.monthDay) fail('Pick a day of the month');
      // the clock has no task: it can only make one, and has nothing to check
      if (rule.actions.some((a) => a.type !== 'create_task')) {
        fail('A rule at a set time can only create tasks');
      }
      if (rule.conditions.length > 0) {
        fail('A rule at a set time has no task to check');
      }
    }
    if (
      !triggerHasActor(t.type) &&
      rule.actions.some((a) => a.type === 'assign' && a.userId === ACTOR)
    ) {
      fail('Nobody makes this change, so there is nobody to assign');
    }
  });

export type SaveRuleBody = z.infer<typeof saveRuleSchema>;

/** The whole rule again, or only its switch. */
export const updateRuleSchema = z.union([
  saveRuleSchema,
  z.strictObject({ enabled: z.boolean() }),
]);

export type UpdateRuleBody = z.infer<typeof updateRuleSchema>;

export const saveTemplateSchema = z.strictObject({
  title: z.string().trim().min(1).max(MAX_TASK_TITLE_LEN),
  description: z
    .string()
    .trim()
    .max(MAX_TASK_DESCRIPTION_LEN)
    .nullable()
    .optional(),
  priority: priority.optional(),
  tags: z.array(label).max(30).optional(),
  subtasks: z
    .array(z.string().trim().min(1).max(500))
    .max(MAX_TEMPLATE_SUBTASKS)
    .optional(),
  assigneeIds: z.array(id).max(20).optional(),
  dueInDays: z.number().int().min(0).max(365).nullable().optional(),
});

export type SaveTemplateBody = z.infer<typeof saveTemplateSchema>;

export const updateTemplateSchema = saveTemplateSchema.partial();

export type UpdateTemplateBody = z.infer<typeof updateTemplateSchema>;

export const useTemplateSchema = z.strictObject({ columnId: id });

export type UseTemplateBody = z.infer<typeof useTemplateSchema>;

const webhookEvent = z.enum([
  'task.created',
  'task.moved',
  'task.finished',
  'task.updated',
  'task.removed',
  'comment.added',
]);
// where it leads is checked again each time it is sent
const webhookUrl = z.string().trim().min(1).max(2000);
const webhookSecret = z.string().min(16).max(200);

export const saveWebhookSchema = z.strictObject({
  name: z.string().trim().min(1).max(80),
  url: webhookUrl,
  events: z.array(webhookEvent).min(1).max(6),
  // made in the browser and shown there once; stored encrypted
  secret: webhookSecret,
});

export type SaveWebhookBody = z.infer<typeof saveWebhookSchema>;

export const updateWebhookSchema = z.strictObject({
  name: z.string().trim().min(1).max(80).optional(),
  url: webhookUrl.optional(),
  events: z.array(webhookEvent).min(1).max(6).optional(),
  enabled: z.boolean().optional(),
});

export type UpdateWebhookBody = z.infer<typeof updateWebhookSchema>;

/** A webhook that is not saved yet (address and secret), or a saved one. */
export const testWebhookSchema = z.union([
  z.strictObject({ url: webhookUrl, secret: webhookSecret }),
  z.strictObject({ webhookId: id }),
]);

export type TestWebhookBody = z.infer<typeof testWebhookSchema>;
