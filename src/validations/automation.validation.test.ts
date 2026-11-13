import { describe, expect, it } from 'vitest';
import {
  saveRuleSchema,
  saveTemplateSchema,
  saveWebhookSchema,
  testWebhookSchema,
  updateRuleSchema,
} from './automation.validation';

const ID = '11111111-1111-4111-8111-111111111111';
const ok = (value: unknown) => saveRuleSchema.safeParse(value).success;

describe('a rule as it is saved', () => {
  it('takes a trigger, conditions and at least one step', () => {
    expect(
      ok({
        trigger: { type: 'task_moved', toColumnId: ID },
        conditions: [{ field: 'assignee', op: 'is_empty' }],
        actions: [{ type: 'assign', userId: ID }],
      }),
    ).toBe(true);
    expect(
      ok({ trigger: { type: 'task_finished' }, conditions: [], actions: [] }),
    ).toBe(false);
  });

  it('refuses fields a trigger does not have', () => {
    expect(
      ok({
        trigger: { type: 'task_finished', columnId: ID },
        conditions: [],
        actions: [{ type: 'archive' }],
      }),
    ).toBe(false);
  });

  it('a rule at a set time only creates tasks, and needs its day', () => {
    const schedule = (trigger: object, actions: object[] = []) =>
      ok({
        trigger: { type: 'schedule', time: '09:00', ...trigger },
        conditions: [],
        actions: actions.length
          ? actions
          : [{ type: 'create_task', templateId: ID, columnId: ID }],
      });
    expect(schedule({ every: 'week', weekdays: [1] })).toBe(true);
    expect(schedule({ every: 'week', weekdays: [] })).toBe(false);
    expect(schedule({ every: 'month' })).toBe(false);
    expect(schedule({ every: 'month', monthDay: 31 })).toBe(false);
    expect(schedule({ every: 'day' }, [{ type: 'archive' }])).toBe(false);
    expect(schedule({ every: 'day', time: '09:10' })).toBe(false);
  });

  it('"whoever made the change" needs a change someone made', () => {
    const assignActor = (type: string, extra: object = {}) =>
      ok({
        trigger: { type, ...extra },
        conditions: [],
        actions: [{ type: 'assign', userId: 'actor' }],
      });
    expect(assignActor('task_moved')).toBe(true);
    expect(assignActor('due_passed')).toBe(false);
    expect(assignActor('task_idle', { days: 7 })).toBe(false);
  });

  it('an update is the whole rule or only its switch', () => {
    expect(updateRuleSchema.safeParse({ enabled: false }).success).toBe(true);
    expect(
      updateRuleSchema.safeParse({ enabled: false, actions: [] }).success,
    ).toBe(false);
  });
});

describe('templates and webhooks as they are saved', () => {
  it('a template needs a title', () => {
    expect(saveTemplateSchema.safeParse({ title: 'Bug report' }).success).toBe(
      true,
    );
    expect(saveTemplateSchema.safeParse({ title: '  ' }).success).toBe(false);
    expect(
      saveTemplateSchema.safeParse({ title: 'x', dueInDays: -1 }).success,
    ).toBe(false);
  });

  it('a webhook needs a name, an address, an event and a secret', () => {
    const hook = {
      name: 'Team chat',
      url: 'https://hooks.example.com/x',
      events: ['task.finished'],
      secret: 'whsec_0123456789abcdef',
    };
    expect(saveWebhookSchema.safeParse(hook).success).toBe(true);
    expect(saveWebhookSchema.safeParse({ ...hook, events: [] }).success).toBe(
      false,
    );
    expect(
      saveWebhookSchema.safeParse({ ...hook, events: ['task.exploded'] })
        .success,
    ).toBe(false);
    expect(
      saveWebhookSchema.safeParse({ ...hook, secret: 'short' }).success,
    ).toBe(false);
  });

  it('a test goes to a saved webhook or to an address with its secret', () => {
    expect(testWebhookSchema.safeParse({ webhookId: ID }).success).toBe(true);
    expect(
      testWebhookSchema.safeParse({
        url: 'https://x.example',
        secret: 'whsec_0123456789abcdef',
      }).success,
    ).toBe(true);
    expect(
      testWebhookSchema.safeParse({ url: 'https://x.example' }).success,
    ).toBe(false);
  });
});
