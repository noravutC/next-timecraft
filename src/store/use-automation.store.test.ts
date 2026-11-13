import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  AutomationRule,
  BoardAutomation,
  TaskCache,
  TaskTemplate,
  Webhook,
} from '@/types';

vi.mock('@/services/automation.service', () => ({
  automationServices: {
    getBoard: vi.fn(),
    listTemplates: vi.fn(),
    createRule: vi.fn(),
    updateRule: vi.fn(),
    deleteRule: vi.fn(),
    createTemplate: vi.fn(),
    updateTemplate: vi.fn(),
    deleteTemplate: vi.fn(),
    useTemplate: vi.fn(),
    createWebhook: vi.fn(),
    updateWebhook: vi.fn(),
    deleteWebhook: vi.fn(),
  },
}));
vi.mock('./use-task.store', () => ({
  useTaskStore: { getState: () => ({ addTasksFromRealtime: addTasks }) },
}));
vi.mock('./use-assignee.store', () => ({
  useAssigneeStore: { getState: () => ({ ingestMany: vi.fn() }) },
}));
vi.mock('./use-subtask.store', () => ({
  useSubtaskStore: { getState: () => ({ ingestProgress: vi.fn() }) },
}));

const addTasks = vi.fn();

import { automationServices } from '@/services/automation.service';
import { useAutomationStore } from './use-automation.store';

const services = vi.mocked(automationServices);
const rule = (id: string, over: Partial<AutomationRule> = {}) =>
  ({
    id,
    trigger: { type: 'task_finished' },
    conditions: [],
    actions: [{ type: 'archive' }],
    enabled: true,
    brokenReason: null,
    runsThisWeek: 3,
    ...over,
  }) as AutomationRule;
const template = (id: string, over: Partial<TaskTemplate> = {}) =>
  ({ id, title: 'Weekly review', usedCount: 0, ...over }) as TaskTemplate;
const webhook = (id: string, over: Partial<Webhook> = {}) =>
  ({
    id,
    name: 'Team chat',
    url: 'https://x',
    events: [],
    enabled: true,
    ...over,
  }) as Webhook;
const state = () => useAutomationStore.getState();
const draft = {
  trigger: { type: 'task_finished' as const },
  conditions: [],
  actions: [{ type: 'archive' as const }],
  enabled: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  useAutomationStore.setState({
    projectId: 'p1',
    loadedFor: 'p1',
    rules: { r1: rule('r1') },
    templates: { t1: template('t1') },
    webhooks: { w1: webhook('w1') },
    status: 'none',
    intent: null,
  });
});

describe('loading a board', () => {
  const board = {
    rules: [rule('r9')],
    templates: [template('t9')],
    webhooks: [],
    timeZone: 'Asia/Bangkok',
    canManage: true,
    canEditTemplates: true,
    webhooksAllowed: false,
  } as BoardAutomation;

  it('drops the other board’s data at once, then fills in this one’s', async () => {
    let resolve: (data: BoardAutomation) => void = () => {};
    services.getBoard.mockReturnValue(new Promise((r) => (resolve = r)));
    const loading = state().fetchBoard('p2', new Date());
    expect(state()).toMatchObject({
      projectId: 'p2',
      loadedFor: null,
      rules: {},
    });
    resolve(board);
    await loading;
    expect(state()).toMatchObject({
      loadedFor: 'p2',
      timeZone: 'Asia/Bangkok',
      canManage: true,
      status: 'none',
    });
    expect(Object.keys(state().rules)).toEqual(['r9']);
  });

  it('ignores an answer for a board that is no longer open', async () => {
    let resolve: (data: BoardAutomation) => void = () => {};
    services.getBoard.mockReturnValue(new Promise((r) => (resolve = r)));
    const loading = state().fetchBoard('p2', new Date());
    state().useBoard('p3');
    resolve(board);
    await loading;
    expect(state()).toMatchObject({
      projectId: 'p3',
      loadedFor: null,
      rules: {},
    });
  });

  it('marks a failed load', async () => {
    services.getBoard.mockRejectedValue(new Error('offline'));
    await expect(state().fetchBoard('p1', new Date())).rejects.toThrow(
      'offline',
    );
    expect(state().status).toBe('error');
  });

  it('can load the templates alone', async () => {
    services.listTemplates.mockResolvedValue([template('t5')]);
    await state().fetchTemplates('p1');
    expect(Object.keys(state().templates)).toEqual(['t5']);
  });
});

describe('rules', () => {
  it('a new rule shows once the server has it', async () => {
    services.createRule.mockResolvedValue({
      created: rule('r2'),
      message: '',
      status: 201,
    });
    await state().saveRule(null, draft);
    expect(Object.keys(state().rules)).toEqual(['r1', 'r2']);
  });

  it('a saved rule changes at once, is mended, and keeps its run count', async () => {
    useAutomationStore.setState({
      rules: { r1: rule('r1', { brokenReason: 'x' }) },
    });
    services.updateRule.mockResolvedValue({
      updated: rule('r1', { enabled: false, runsThisWeek: undefined }),
      message: '',
      status: 200,
    });
    const saving = state().saveRule('r1', { ...draft, enabled: false });
    expect(state().rules.r1).toMatchObject({
      enabled: false,
      brokenReason: null,
    });
    await saving;
    expect(state().rules.r1.runsThisWeek).toBe(3);
  });

  it('a switch that the server refuses goes back', async () => {
    services.updateRule.mockRejectedValue(new Error('no'));
    const toggling = state().toggleRule('r1', false);
    expect(state().rules.r1.enabled).toBe(false);
    await expect(toggling).rejects.toThrow('no');
    expect(state().rules.r1.enabled).toBe(true);
  });

  it('an answer that arrives after the rule was deleted does not bring it back', async () => {
    let answer: (value: {
      updated: AutomationRule;
      message: string;
      status: number;
    }) => void = () => {};
    services.updateRule.mockReturnValue(new Promise((r) => (answer = r)));
    services.deleteRule.mockResolvedValue({
      deleted: true,
      message: '',
      status: 200,
    });
    const toggling = state().toggleRule('r1', false);
    await state().deleteRule('r1');
    answer({
      updated: rule('r1', { enabled: false }),
      message: '',
      status: 200,
    });
    await toggling;
    expect(state().rules.r1).toBeUndefined();
  });

  it('a delete that the server refuses comes back', async () => {
    services.deleteRule.mockRejectedValue(new Error('no'));
    const deleting = state().deleteRule('r1');
    expect(state().rules.r1).toBeUndefined();
    await expect(deleting).rejects.toThrow('no');
    expect(state().rules.r1).toBeDefined();
  });
});

describe('templates', () => {
  it('are created, changed and deleted', async () => {
    services.createTemplate.mockResolvedValue({
      created: template('t2'),
      message: '',
      status: 201,
    });
    await state().saveTemplate(null, { title: 'Bug report' });
    expect(Object.keys(state().templates)).toEqual(['t1', 't2']);

    services.updateTemplate.mockResolvedValue({
      updated: template('t1', { title: 'Renamed' }),
      message: '',
      status: 200,
    });
    await state().saveTemplate('t1', { title: 'Renamed' });
    expect(state().templates.t1.title).toBe('Renamed');

    services.deleteTemplate.mockResolvedValue({
      deleted: true,
      message: '',
      status: 200,
    });
    await state().deleteTemplate('t2');
    expect(Object.keys(state().templates)).toEqual(['t1']);
  });

  it('a task made from one goes on the board and counts as a use', async () => {
    const task = { id: 'task1', title: 'Weekly review' } as TaskCache;
    services.useTemplate.mockResolvedValue({
      created: task,
      assignees: [],
      subtasks: {},
      message: '',
      status: 201,
    });
    expect(await state().createFromTemplate('t1', 'col')).toBe(task);
    expect(addTasks).toHaveBeenCalledWith([task]);
    expect(state().templates.t1.usedCount).toBe(1);
  });
});

describe('webhooks', () => {
  it('a new one needs its secret', async () => {
    const payload = { name: 'n', url: 'https://x', events: [] };
    await state().saveWebhook(null, payload);
    expect(services.createWebhook).not.toHaveBeenCalled();
    services.createWebhook.mockResolvedValue({
      created: webhook('w2'),
      message: '',
      status: 201,
    });
    await state().saveWebhook(null, {
      ...payload,
      secret: 'whsec_0123456789abcdef',
    });
    expect(Object.keys(state().webhooks)).toEqual(['w1', 'w2']);
  });

  it('is changed, switched and deleted, going back when refused', async () => {
    services.updateWebhook.mockResolvedValue({
      updated: webhook('w1', { name: 'Renamed' }),
      message: '',
      status: 200,
    });
    await state().saveWebhook('w1', {
      name: 'Renamed',
      url: 'https://x',
      events: [],
    });
    expect(state().webhooks.w1.name).toBe('Renamed');

    services.updateWebhook.mockRejectedValue(new Error('no'));
    await expect(state().toggleWebhook('w1', false)).rejects.toThrow('no');
    expect(state().webhooks.w1.enabled).toBe(true);

    services.deleteWebhook.mockResolvedValue({
      deleted: true,
      message: '',
      status: 200,
    });
    await state().deleteWebhook('w1');
    expect(state().webhooks).toEqual({});
  });
});

describe('what the board asks the view to open', () => {
  it('is kept until the view takes it', () => {
    state().setIntent({ ruleId: 'r1' });
    expect(state().intent).toEqual({ ruleId: 'r1' });
    state().setIntent(null);
    expect(state().intent).toBeNull();
  });
});
