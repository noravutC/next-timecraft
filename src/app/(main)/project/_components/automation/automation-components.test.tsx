// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AutomationEmpty } from './automation-empty';
import {
  namesOf,
  type BoardContext,
  type RuleRowView,
} from './automation-operations';
import { AutomationSkeleton } from './automation-skeleton';
import { AutomationToolbar } from './automation-toolbar';
import { HistoryRow } from './history-row';
import type { HistoryRowView } from './history-operations';
import { emptyDraft } from './rule-editor-operations';
import { RuleSheet } from './rule-sheet';
import { RulesSection } from './rules-section';
import { emptyTemplate } from './template-operations';
import { TemplateSheet } from './template-sheet';
import { TemplatesSection } from './templates-section';
import { emptyWebhook } from './webhook-operations';
import { WebhookSheet } from './webhook-sheet';
import { WebhooksSection } from './webhooks-section';

// the editor asks for a saved rule's last runs: none here
vi.mock('@/services/automation.service', () => ({
  automationServices: {
    getHistory: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
  },
}));
// the view switch reads the open view from the app's store
vi.mock('../board-view-switch', () => ({ BoardViewSwitch: () => null }));

const board: BoardContext = {
  columns: [
    { id: 'todo', name: 'To do', color: '#00f', isDone: false },
    { id: 'done', name: 'Done', color: '#0a0', isDone: true },
  ],
  members: [{ id: 'u1', name: 'Ploy Srisuk', avatar: null }],
  labels: ['Bug'],
  labelColors: { Bug: '#f00' },
  templates: [],
};
const row = (over: Partial<RuleRowView>): RuleRowView => ({
  id: 'r1',
  trigger: 'task_moved',
  tone: 'change',
  when: [
    { kind: 'text', text: 'When a task moves to' },
    { kind: 'column', text: 'Review', color: '#80f' },
  ],
  then: [
    { kind: 'text', text: 'Assign' },
    { kind: 'person', text: 'Ploy S.', userId: 'u1' },
    { kind: 'text', text: 'and add the label' },
    { kind: 'label', text: 'Bug' },
    { kind: 'text', text: 'and set the priority to' },
    { kind: 'priority', text: 'High', level: 'high' },
  ],
  sentence: 'When a task moves to Review, assign Ploy S.',
  enabled: true,
  fix: null,
  meta: '14 runs this week',
  ...over,
});
const noop = () => {};

describe('AutomationToolbar', () => {
  it('shows the sections with their counts and the section’s button', async () => {
    const onSection = vi.fn();
    const onNew = vi.fn();
    render(
      <AutomationToolbar
        section="rules"
        onSection={onSection}
        counts={{ rules: 8, templates: 3 }}
        primary={{ label: 'New rule', onClick: onNew }}
      />,
    );
    const sections = screen.getByRole('radiogroup', {
      name: 'Automation section',
    });
    expect(
      within(sections).getByRole('radio', { name: 'Rules 8' }),
    ).toBeChecked();
    expect(
      within(sections).getByRole('radio', { name: 'History' }),
    ).toBeVisible();
    await userEvent.click(
      within(sections).getByRole('radio', { name: 'Templates 3' }),
    );
    expect(onSection).toHaveBeenCalledWith('templates');
    await userEvent.click(screen.getByRole('button', { name: 'New rule' }));
    expect(onNew).toHaveBeenCalled();
  });
});

describe('RulesSection', () => {
  const props = {
    summary: { text: 'rules ran 37 times.', broken: '1 rule needs a fix' },
    ideas: [
      {
        key: 'due',
        title: 'Raise the priority the day before a due date',
        icon: 'due_soon' as const,
        draft: {
          ...emptyDraft,
          trigger: { type: 'due_soon' as const, days: 1 },
        },
      },
    ],
    people: { u1: { name: 'Ploy Srisuk', avatar: null } },
    tagColors: {},
    canManage: true,
    onOpen: noop,
    onToggle: noop,
    onDelete: noop,
    onIdea: noop,
    onBroken: noop,
  };

  it('reads each rule as a sentence, in its group', () => {
    render(
      <RulesSection
        {...props}
        groups={[
          { caption: 'When something happens', rows: [row({})] },
          {
            caption: 'On a schedule',
            rows: [
              row({ id: 'r2', tone: 'schedule', meta: 'Next: Mon, Nov 16' }),
            ],
          },
        ]}
      />,
    );
    expect(screen.getByText(/rules ran 37 times\./)).toBeVisible();
    const changes = screen.getByRole('region', {
      name: 'When something happens',
    });
    expect(within(changes).getByText('When a task moves to')).toBeVisible();
    expect(within(changes).getByText('Review')).toBeVisible();
    expect(within(changes).getByText('Ploy S.')).toBeVisible();
    expect(within(changes).getByText('14 runs this week')).toBeVisible();
    expect(
      within(screen.getByRole('region', { name: 'On a schedule' })).getByText(
        'Next: Mon, Nov 16',
      ),
    ).toBeVisible();
  });

  it('opens, switches and reports what needs a fix', async () => {
    const onOpen = vi.fn();
    const onToggle = vi.fn();
    const onBroken = vi.fn();
    const onIdea = vi.fn();
    render(
      <RulesSection
        {...props}
        onOpen={onOpen}
        onToggle={onToggle}
        onBroken={onBroken}
        onIdea={onIdea}
        groups={[
          {
            caption: 'When something happens',
            rows: [row({ tone: 'fix', fix: 'The label Triage was deleted' })],
          },
        ]}
      />,
    );
    expect(screen.getByText('Needs a fix')).toBeVisible();
    await userEvent.click(
      screen.getByRole('switch', {
        name: 'Turn off: When a task moves to Review, assign Ploy S.',
      }),
    );
    expect(onToggle).toHaveBeenCalledWith('r1', false);
    await userEvent.click(
      screen.getByRole('button', { name: /^When a task moves to/ }),
    );
    expect(onOpen).toHaveBeenCalledWith('r1');
    await userEvent.click(
      screen.getByRole('button', { name: '1 rule needs a fix' }),
    );
    expect(onBroken).toHaveBeenCalled();
    await userEvent.click(
      screen.getByRole('button', { name: /Raise the priority the day before/ }),
    );
    expect(onIdea).toHaveBeenCalledWith(props.ideas[0]);
  });

  it('is read-only for someone who cannot manage rules', () => {
    render(
      <RulesSection
        {...props}
        canManage={false}
        groups={[
          {
            caption: 'When something happens',
            rows: [row({ enabled: false, meta: 'Off' })],
          },
        ]}
      />,
    );
    expect(screen.getByRole('switch')).toBeDisabled();
    expect(screen.queryByRole('button', { name: /^More actions/ })).toBeNull();
    expect(
      screen.queryByRole('region', { name: 'Ideas to start with' }),
    ).toBeNull();
    expect(screen.getByText('Off')).toBeVisible();
  });
});

describe('AutomationEmpty and AutomationSkeleton', () => {
  it('offers ideas and a blank rule to someone who can add them', async () => {
    const onNew = vi.fn();
    render(
      <AutomationEmpty
        ideas={[
          {
            key: 'due',
            title: 'Raise the priority the day before a due date',
            icon: 'due_soon',
            draft: { ...emptyDraft, trigger: { type: 'due_soon', days: 1 } },
          },
        ]}
        canManage
        onIdea={noop}
        onNew={onNew}
      />,
    );
    expect(
      screen.getByRole('heading', {
        name: 'Let the board do the routine work',
      }),
    ).toBeVisible();
    await userEvent.click(
      screen.getByRole('button', { name: 'Build a rule from scratch' }),
    );
    expect(onNew).toHaveBeenCalled();
  });

  it('only explains to everyone else', () => {
    render(
      <AutomationEmpty
        ideas={[]}
        canManage={false}
        onIdea={noop}
        onNew={noop}
      />,
    );
    expect(
      screen.getByText(/Owners and admins of the board can add them/),
    ).toBeVisible();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('says it is loading', () => {
    render(<AutomationSkeleton />);
    expect(
      screen.getByRole('status', { name: 'Loading automation' }),
    ).toBeVisible();
  });
});

describe('TemplatesSection', () => {
  const props = {
    people: { u1: { name: 'Ploy Srisuk', avatar: null } },
    tagColors: {},
    columns: board.columns,
    canEdit: true,
    canUse: true,
    onOpen: noop,
    onUse: noop,
    onNew: noop,
  };
  it('shows a card per template', async () => {
    const onOpen = vi.fn();
    render(
      <TemplatesSection
        {...props}
        onOpen={onOpen}
        cards={[
          {
            id: 't1',
            title: 'Weekly review',
            labels: ['Bug'],
            priority: 'medium',
            subtasks: '3 subtasks',
            due: 'Due in 7 days',
            assigneeIds: ['u1'],
            usage: 'Every Monday at 9:00',
            repeats: true,
          },
        ]}
      />,
    );
    expect(screen.getByText('3 subtasks')).toBeVisible();
    expect(screen.getByText('Due in 7 days')).toBeVisible();
    expect(screen.getByText('Every Monday at 9:00')).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Use Weekly review' }),
    ).toBeVisible();
    await userEvent.click(
      screen.getByRole('button', { name: 'Weekly review' }),
    );
    expect(onOpen).toHaveBeenCalledWith('t1');
  });

  it('with none, says what a template is and offers the first', async () => {
    const onNew = vi.fn();
    render(<TemplatesSection {...props} cards={[]} onNew={onNew} />);
    expect(
      screen.getByRole('heading', { name: 'No templates yet' }),
    ).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'New template' }));
    expect(onNew).toHaveBeenCalled();
  });
});

describe('WebhooksSection', () => {
  const props = {
    rows: [],
    canManage: true,
    allowed: true,
    onOpen: noop,
    onToggle: noop,
    onDelete: noop,
    onFailed: noop,
    onNew: noop,
  };
  it('is locked in the guest workspace and for those who cannot manage', () => {
    const { rerender } = render(<WebhooksSection {...props} allowed={false} />);
    expect(
      screen.getByText(/Webhooks are off in the guest workspace/),
    ).toBeVisible();
    rerender(<WebhooksSection {...props} canManage={false} />);
    expect(
      screen.getByText(/Only owners and admins of the board/),
    ).toBeVisible();
    // the format is not a secret: it stays
    expect(screen.getByLabelText('An example request')).toHaveTextContent(
      'X-TimeCraft-Signature',
    );
  });

  it('lists webhooks with how they are doing', async () => {
    const onFailed = vi.fn();
    const onToggle = vi.fn();
    render(
      <WebhooksSection
        {...props}
        onFailed={onFailed}
        onToggle={onToggle}
        rows={[
          {
            id: 'w1',
            name: 'Status page sync',
            url: 'https://status.example/api',
            events: ['Task finished'],
            enabled: true,
            tone: 'failing',
            status: 'Failing: 3 of the last 5',
            sub: null,
          },
        ]}
      />,
    );
    expect(screen.getByText('Failing: 3 of the last 5')).toBeVisible();
    expect(screen.getByText('https://status.example/api')).toBeVisible();
    await userEvent.click(
      screen.getByRole('button', { name: 'See what failed' }),
    );
    expect(onFailed).toHaveBeenCalled();
    await userEvent.click(
      screen.getByRole('switch', { name: 'Turn off: Status page sync' }),
    );
    expect(onToggle).toHaveBeenCalledWith('w1', false);
  });

  it('with none, offers the first', () => {
    render(<WebhooksSection {...props} />);
    expect(
      screen.getByRole('heading', { name: 'No webhooks yet' }),
    ).toBeVisible();
  });
});

describe('HistoryRow', () => {
  const failed: HistoryRowView = {
    id: 'd1',
    kind: 'delivery',
    time: '09:58',
    icon: 'webhook',
    tone: 'hook',
    name: 'Status page sync',
    sub: 'Webhook · Task finished',
    task: 'Build images',
    taskId: 't1',
    chip: { text: 'Failed', tone: 'bad' },
    detail: '500 · try 3 of 5',
    failure: {
      lead: 'The receiver answered',
      answer: '500 Internal Server Error',
      rest: 'after 1.2 seconds. This was try 3 of 5. The next one is in 10 minutes.',
      request: 'POST https://status.example/api',
      payload: '{}',
    },
  };
  it('explains a message that was not accepted and can send it again', async () => {
    const onResend = vi.fn();
    const onCopy = vi.fn();
    const onOpenTask = vi.fn();
    render(
      <ul>
        <HistoryRow
          row={failed}
          canResend
          resending={false}
          onOpenTask={onOpenTask}
          onResend={onResend}
          onCopy={onCopy}
        />
      </ul>,
    );
    expect(screen.getByText('500 Internal Server Error')).toBeVisible();
    expect(screen.getByText('500 · try 3 of 5')).toBeVisible();
    await userEvent.click(
      screen.getByRole('button', { name: 'Send again now' }),
    );
    expect(onResend).toHaveBeenCalledWith('d1');
    await userEvent.click(
      screen.getByRole('button', { name: 'Copy what was sent' }),
    );
    expect(onCopy).toHaveBeenCalledWith('{}');
    await userEvent.click(screen.getByRole('button', { name: 'Build images' }));
    expect(onOpenTask).toHaveBeenCalledWith('t1');
  });

  it('shows a rule run plainly, with no way to send anything', () => {
    render(
      <ul>
        <HistoryRow
          row={{
            ...failed,
            kind: 'run',
            icon: 'task_moved',
            tone: 'change',
            name: 'When a task moves to Review',
            sub: 'Rule',
            taskId: null,
            chip: { text: 'Done', tone: 'good' },
            detail: 'Assigned Ploy S.',
            failure: null,
          }}
          canResend={false}
          resending={false}
          onOpenTask={noop}
          onResend={noop}
          onCopy={noop}
        />
      </ul>,
    );
    expect(screen.getByText('Done')).toBeVisible();
    expect(screen.getByText('Assigned Ploy S.')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Send again now' })).toBeNull();
  });
});

describe('RuleSheet', () => {
  const props = {
    projectId: 'p1',
    ruleId: null,
    initial: emptyDraft,
    brokenReason: null,
    board,
    names: namesOf(board),
    templates: {},
    timeZone: 'Asia/Bangkok',
    canManage: true,
    onClose: noop,
    onSave: async () => {},
    onDelete: noop,
    onHistory: noop,
    onEditTemplate: noop,
  };

  it('a new rule is a When and a Then picked from the lists', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<RuleSheet {...props} onSave={onSave} />);
    const save = screen.getByRole('button', { name: 'Save rule' });
    expect(save).toBeDisabled();
    expect(screen.getByText('Pick a When and a Then to save')).toBeVisible();

    await userEvent.click(
      screen.getByRole('button', { name: /^A task is finished/ }),
    );
    expect(screen.getByText('Pick what the rule should do')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Archive it' }));
    expect(
      screen.getByText('When a task is finished, archive it.'),
    ).toBeVisible();

    expect(save).toBeEnabled();
    await userEvent.click(save);
    expect(onSave).toHaveBeenCalledWith({
      trigger: { type: 'task_finished' },
      conditions: [],
      actions: [{ type: 'archive' }],
      enabled: true,
    });
  });

  it('a saved rule can add a condition, be switched off, and be deleted', async () => {
    const onDelete = vi.fn();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <RuleSheet
        {...props}
        ruleId="r1"
        initial={{
          trigger: { type: 'task_finished' },
          conditions: [],
          actions: [{ type: 'archive' }],
          enabled: true,
        }}
        brokenReason="The label Triage was deleted"
        onDelete={onDelete}
        onSave={onSave}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'The label Triage was deleted, so this rule is paused.',
    );
    expect(
      screen.getByText('Without a condition, the rule runs for every task.'),
    ).toBeVisible();
    await userEvent.click(
      screen.getByRole('button', { name: 'Add a condition' }),
    );
    await userEvent.click(screen.getByRole('switch', { name: 'Rule is on' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save rule' }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        conditions: [{ field: 'assignee', op: 'is_empty' }],
        enabled: false,
      }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Delete rule' }));
    expect(onDelete).toHaveBeenCalled();
  });

  it('a schedule shows its days and has no conditions', async () => {
    render(
      <RuleSheet
        {...props}
        initial={{
          trigger: {
            type: 'schedule',
            every: 'week',
            weekdays: [1],
            time: '09:00',
          },
          conditions: [],
          actions: [{ type: 'create_task', templateId: '', columnId: '' }],
          enabled: true,
        }}
      />,
    );
    const days = screen.getByRole('group', { name: 'Days of the week' });
    expect(
      within(days).getByRole('button', { name: 'Monday' }),
    ).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(within(days).getByRole('button', { name: 'Monday' }));
    expect(screen.getByText('Pick at least one day')).toBeVisible();
    expect(screen.queryByRole('region', { name: 'Only if' })).toBeNull();
    expect(screen.getByText(/Times are in Asia\/Bangkok/)).toBeVisible();
  });

  it('is read-only for someone who cannot manage rules', () => {
    render(
      <RuleSheet
        {...props}
        ruleId="r1"
        canManage={false}
        initial={{
          trigger: { type: 'task_finished' },
          conditions: [],
          actions: [{ type: 'archive' }],
          enabled: true,
        }}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Save rule' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Delete rule' })).toBeNull();
    expect(
      screen.getByText('Only owners and admins of the board can change rules.'),
    ).toBeVisible();
  });
});

describe('TemplateSheet', () => {
  it('saves what was typed, with its subtasks', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <TemplateSheet
        templateId={null}
        initial={emptyTemplate}
        board={board}
        tagColors={{}}
        uses={[]}
        canEdit
        onClose={noop}
        onSave={onSave}
        onDelete={noop}
        onOpenRule={noop}
      />,
    );
    const save = screen.getByRole('button', { name: 'Save template' });
    expect(save).toBeDisabled();
    await userEvent.type(screen.getByLabelText('Template title'), 'Bug report');
    await userEvent.click(
      screen.getByRole('button', { name: 'Add a subtask' }),
    );
    await userEvent.type(
      screen.getByLabelText('Subtask 1'),
      'Steps to reproduce',
    );
    await userEvent.click(save);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Bug report',
        subtasks: ['Steps to reproduce'],
        description: null,
        dueInDays: null,
      }),
    );
  });

  it('lists the rules that use it', async () => {
    const onOpenRule = vi.fn();
    render(
      <TemplateSheet
        templateId="t1"
        initial={{
          ...emptyTemplate,
          title: 'Weekly review',
          subtasks: ['One'],
        }}
        board={board}
        tagColors={{}}
        uses={[
          {
            ruleId: 'r1',
            text: 'Every Monday at 9:00',
            next: 'Next: Mon, Nov 16',
          },
        ]}
        canEdit
        onClose={noop}
        onSave={async () => {}}
        onDelete={noop}
        onOpenRule={onOpenRule}
      />,
    );
    await userEvent.click(
      screen.getByRole('button', { name: /Every Monday at 9:00/ }),
    );
    expect(onOpenRule).toHaveBeenCalledWith('r1');
    await userEvent.click(
      screen.getByRole('button', { name: 'Remove subtask 1' }),
    );
    expect(screen.queryByLabelText('Subtask 1')).toBeNull();
  });
});

describe('WebhookSheet', () => {
  const props = {
    webhookId: null,
    initial: emptyWebhook,
    secret: 'whsec_test_secret_0123456789',
    onClose: noop,
    onSave: async () => {},
    onDelete: noop,
    onTest: async () => ({
      accepted: true,
      status: 200,
      durationMs: 182,
      error: null,
    }),
  };

  it('a new one shows its secret and saves what was picked', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<WebhookSheet {...props} onSave={onSave} />);
    expect(screen.getByText('whsec_test_secret_0123456789')).toBeVisible();
    expect(screen.getByText('Give the webhook a name')).toBeVisible();
    await userEvent.type(screen.getByLabelText('Name'), 'Team chat');
    await userEvent.type(
      screen.getByLabelText('Send to'),
      'https://hooks.example.com/x',
    );
    await userEvent.click(
      screen.getByRole('checkbox', { name: 'A task moves' }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Add webhook' }));
    expect(onSave).toHaveBeenCalledWith({
      name: 'Team chat',
      url: 'https://hooks.example.com/x',
      events: ['task.created', 'task.finished', 'task.moved'],
    });
  });

  it('says how a test was received', async () => {
    render(
      <WebhookSheet
        {...props}
        initial={{
          ...emptyWebhook,
          name: 'x',
          url: 'https://hooks.example.com/x',
        }}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Send a test' }));
    expect(await screen.findByText('Accepted: 200 in 182 ms')).toBeVisible();
  });

  it('a saved one never shows its secret again', () => {
    render(
      <WebhookSheet
        {...props}
        webhookId="w1"
        secret={null}
        initial={{
          ...emptyWebhook,
          name: 'x',
          url: 'https://hooks.example.com/x',
        }}
      />,
    );
    expect(
      screen.getByText(/It was shown once, when this webhook was added/),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Save webhook' })).toBeEnabled();
    expect(
      screen.getByRole('button', { name: 'Delete webhook' }),
    ).toBeVisible();
  });
});
