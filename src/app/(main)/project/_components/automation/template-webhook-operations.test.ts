import { describe, expect, it } from 'vitest';
import type { TaskTemplate, Webhook } from '@/types';
import type { BoardContext } from './automation-operations';
import {
  assigneeCandidates,
  canAddSubtask,
  draftOfTemplate,
  dueField,
  dueOf,
  emptyTemplate,
  membersIn,
  templatePayload,
  templateProblem,
} from './template-operations';
import {
  draftOfWebhook,
  emptyWebhook,
  newSecret,
  testText,
  toggleEvent,
  webhookProblem,
  WEBHOOK_SAMPLE,
} from './webhook-operations';

describe('a template being written', () => {
  it('starts from a saved one', () => {
    expect(
      draftOfTemplate({
        title: 'Bug report',
        description: null,
        priority: 'high',
        tags: ['Bug'],
        subtasks: ['a'],
        assigneeIds: [],
        dueInDays: null,
      } as unknown as TaskTemplate),
    ).toEqual({
      ...emptyTemplate,
      title: 'Bug report',
      priority: 'high',
      tags: ['Bug'],
      subtasks: ['a'],
    });
  });

  it('is saved trimmed, without empty subtasks', () => {
    expect(
      templatePayload({
        ...emptyTemplate,
        title: '  Weekly review ',
        description: '  ',
        subtasks: ['One', ' ', ' Two '],
      }),
    ).toMatchObject({
      title: 'Weekly review',
      description: null,
      subtasks: ['One', 'Two'],
    });
  });

  it('needs a title', () => {
    expect(templateProblem(emptyTemplate)).toBe('Give the template a title');
    expect(templateProblem({ ...emptyTemplate, title: 'x' })).toBeNull();
  });

  it('takes up to twenty subtasks', () => {
    expect(canAddSubtask(emptyTemplate)).toBe(true);
    expect(
      canAddSubtask({ ...emptyTemplate, subtasks: Array(20).fill('x') }),
    ).toBe(false);
  });

  it('a due date is none, the same day, or a number of days', () => {
    expect(dueField(null).value).toBe('none');
    expect(dueField(2).value).toBe('2');
    expect(
      dueField(null)
        .options.slice(0, 3)
        .map((o) => o.label),
    ).toEqual(['No due date', 'The same day', '1 day']);
    expect(dueOf('none')).toBeNull();
    expect(dueOf('7')).toBe(7);
  });
});

describe('who a template goes to', () => {
  const board = {
    members: [
      { id: 'u1', name: 'Ploy Srisuk', avatar: null },
      { id: 'u2', name: 'Arthit Kaew', avatar: null },
    ],
  } as BoardContext;
  it('only people still on the board, as the picker wants them', () => {
    expect(membersIn(board, ['u2', 'left']).map((m) => m.id)).toEqual(['u2']);
    expect(assigneeCandidates(board)[0]).toEqual({
      id: 'u1',
      name: 'Ploy Srisuk',
      avatar: null,
      email: '',
    });
  });
});

describe('a webhook being written', () => {
  it('starts with the two events most receivers want', () => {
    expect(emptyWebhook.events).toEqual(['task.created', 'task.finished']);
    expect(
      draftOfWebhook({
        name: 'n',
        url: 'https://x',
        events: ['task.moved'],
      } as Webhook),
    ).toEqual({ name: 'n', url: 'https://x', events: ['task.moved'] });
  });

  it('toggles an event', () => {
    expect(toggleEvent(['task.created'], 'task.moved')).toEqual([
      'task.created',
      'task.moved',
    ]);
    expect(toggleEvent(['task.created'], 'task.created')).toEqual([]);
  });

  it('says what is missing', () => {
    const draft = {
      name: 'Team chat',
      url: 'https://hooks.example.com/x',
      events: emptyWebhook.events,
    };
    expect(webhookProblem({ ...draft, name: ' ' })).toBe(
      'Give the webhook a name',
    );
    expect(webhookProblem({ ...draft, url: '' })).toBe('Say where to send it');
    expect(webhookProblem({ ...draft, url: 'hooks.example.com' })).toBe(
      'That is not a web address',
    );
    expect(webhookProblem({ ...draft, url: 'ftp://x.example' })).toBe(
      'The address must start with https://',
    );
    expect(webhookProblem({ ...draft, events: [] })).toBe(
      'Pick at least one thing to send',
    );
    expect(webhookProblem(draft)).toBeNull();
    // the server decides about http: it allows it only for local testing
    expect(
      webhookProblem({ ...draft, url: 'http://localhost:9000/x' }),
    ).toBeNull();
  });

  it('puts a test result in a few words', () => {
    expect(testText({ status: 200, durationMs: 182, error: null })).toEqual({
      ok: true,
      text: 'Accepted: 200 in 182 ms',
    });
    expect(
      testText({
        status: 500,
        durationMs: 9,
        error: '500 Internal Server Error',
      }),
    ).toEqual({ ok: false, text: 'Not accepted: 500 Internal Server Error' });
    expect(testText({ status: null, durationMs: 9, error: null })).toEqual({
      ok: false,
      text: 'Not accepted: no answer',
    });
  });

  it('makes a new secret each time, safe to paste into a URL or a header', () => {
    const secret = newSecret();
    expect(secret).toMatch(/^whsec_[A-Za-z0-9_-]{32}$/);
    expect(newSecret()).not.toBe(secret);
  });

  it('shows what a request looks like', () => {
    expect(WEBHOOK_SAMPLE).toContain('X-TimeCraft-Signature: sha256=');
  });
});
