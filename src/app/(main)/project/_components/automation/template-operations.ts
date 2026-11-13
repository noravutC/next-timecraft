import { MAX_TEMPLATE_SUBTASKS } from '@/helper/utils/automation';
import { countOf } from '@/helper/utils/insights';
import type { SaveTemplatePayload, TaskPriority, TaskTemplate } from '@/types';
import type { BoardContext } from './automation-operations';
import type { FieldSpec } from './rule-editor-operations';

/** A template while it is being written. */
export type TemplateDraft = {
  title: string;
  description: string;
  priority: TaskPriority;
  tags: string[];
  subtasks: string[];
  assigneeIds: string[];
  dueInDays: number | null;
};

export const emptyTemplate: TemplateDraft = {
  title: '',
  description: '',
  priority: 'medium',
  tags: [],
  subtasks: [],
  assigneeIds: [],
  dueInDays: null,
};

export const draftOfTemplate = (template: TaskTemplate): TemplateDraft => ({
  title: template.title,
  description: template.description ?? '',
  priority: template.priority,
  tags: template.tags,
  subtasks: template.subtasks,
  assigneeIds: template.assigneeIds,
  dueInDays: template.dueInDays,
});

/** What is saved: trimmed, with empty subtasks and an empty description left out. */
export const templatePayload = (draft: TemplateDraft): SaveTemplatePayload => ({
  ...draft,
  title: draft.title.trim(),
  description: draft.description.trim() || null,
  subtasks: draft.subtasks.map((s) => s.trim()).filter(Boolean),
});

/** Why the template cannot be saved yet; null when it can. */
export const templateProblem = (draft: TemplateDraft): string | null =>
  draft.title.trim() ? null : 'Give the template a title';

export const canAddSubtask = (draft: TemplateDraft): boolean =>
  draft.subtasks.length < MAX_TEMPLATE_SUBTASKS;

const NO_DUE = 'none';

/** "No due date", "The same day" or a number of days after it is created. */
export const dueField = (dueInDays: number | null): FieldSpec => ({
  key: 'dueInDays',
  label: 'Due date',
  value: dueInDays === null ? NO_DUE : String(dueInDays),
  options: [
    { value: NO_DUE, label: 'No due date' },
    ...[0, 1, 2, 3, 5, 7, 14, 30].map((n) => ({
      value: String(n),
      label: n === 0 ? 'The same day' : countOf(n, 'day'),
    })),
  ],
});

export const dueOf = (value: string): number | null =>
  value === NO_DUE ? null : Number(value);

/** The board's members who are on the template, in the board's order. */
export const membersIn = (
  board: BoardContext,
  ids: string[],
): BoardContext['members'] => board.members.filter((m) => ids.includes(m.id));

/** Everyone the template can be given to, as the assignee picker wants them. */
export const assigneeCandidates = (board: BoardContext) =>
  board.members.map((m) => ({ ...m, email: '' }));
