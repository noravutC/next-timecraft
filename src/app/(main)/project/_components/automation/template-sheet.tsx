'use client';

import { Calendar, LayoutTemplate, Repeat, Tag, User } from 'lucide-react';
import { useState } from 'react';
import { UserAvatar } from '@/components/people/user-avatar';
import { AssigneePicker } from '@/components/task-detail/parts/assignee-picker';
import { PriorityPicker } from '@/components/task-detail/parts/priority-picker';
import { PropertyRow } from '@/components/task-detail/parts/property-row';
import { TagChip } from '@/components/task-detail/parts/tag-chip';
import { TagPicker } from '@/components/task-detail/parts/tag-picker';
import { PriorityBars } from '@/components/task-meta/priority-bars';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { shortName } from '@/helper/utils/person-name';
import type { SaveTemplatePayload } from '@/types';
import type { ProjectSettings } from '@/types/project-settings';
import type { BoardContext } from './automation-operations';
import { OptionPicker } from './option-picker';
import {
  assigneeCandidates,
  canAddSubtask,
  dueField,
  dueOf,
  membersIn,
  templatePayload,
  templateProblem,
  type TemplateDraft,
} from './template-operations';
import { TemplateSubtasks } from './template-subtasks';

/**
 * A template being written or changed: the fields a new task starts with.
 * Mounted fresh for each template it opens.
 */
export const TemplateSheet = ({
  templateId,
  initial,
  board,
  tagColors,
  uses,
  canEdit,
  onClose,
  onSave,
  onDelete,
  onOpenRule,
}: {
  /** null for a template that is not saved yet */
  templateId: string | null;
  initial: TemplateDraft;
  board: BoardContext;
  tagColors: Required<ProjectSettings>['tagColors'];
  /** the rules that make tasks from it */
  uses: { ruleId: string; text: string; next: string | null }[];
  canEdit: boolean;
  onClose: () => void;
  onSave: (payload: SaveTemplatePayload) => Promise<void>;
  onDelete: () => void;
  onOpenRule: (ruleId: string) => void;
}) => {
  const [draft, setDraft] = useState(initial);
  const [saving, setSaving] = useState(false);
  const problem = templateProblem(draft);
  const set = (patch: Partial<TemplateDraft>) =>
    setDraft((d) => ({ ...d, ...patch }));
  const assignees = membersIn(board, draft.assigneeIds);

  const save = async () => {
    if (problem) return;
    setSaving(true);
    try {
      await onSave(templatePayload(draft));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent aria-describedby={undefined} className="gap-0 sm:max-w-160">
        <header className="flex h-13 shrink-0 items-center border-b border-line pr-14 pl-5">
          <SheetTitle className="inline-flex h-6 items-center gap-1.5 rounded-md bg-surface-hover px-2 text-xs font-medium text-ink-muted">
            <LayoutTemplate aria-hidden className="size-3.25" />
            Template
          </SheetTitle>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-6">
          <Input
            value={draft.title}
            onChange={(e) => set({ title: e.target.value })}
            placeholder="Template title"
            aria-label="Template title"
            disabled={!canEdit}
            maxLength={500}
            className="h-auto border-0 px-0 text-title-sm font-semibold tracking-tight shadow-none focus-visible:ring-0"
          />

          <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-x-2 gap-y-0.5 sm:grid-cols-[8rem_minmax(0,1fr)]">
            <PropertyRow
              icon={
                <PriorityBars
                  priority="high"
                  color="var(--ink-faint)"
                  decorative
                />
              }
              label="Priority"
            >
              <PriorityPicker
                value={draft.priority}
                onChange={(priority) => set({ priority })}
                disabled={!canEdit}
              />
            </PropertyRow>
            <PropertyRow icon={<User />} label="Assignees">
              <div className="flex flex-wrap items-center gap-1.5 py-0.75">
                {assignees.map((a) => (
                  <span
                    key={a.id}
                    className="inline-flex h-7 items-center gap-1.5 rounded-full border border-line pr-2.5 pl-0.75 text-sm text-ink"
                  >
                    <UserAvatar
                      name={a.name}
                      image={a.avatar}
                      seed={a.id}
                      size="sm"
                    />
                    {shortName(a.name)}
                  </span>
                ))}
                {canEdit && (
                  <AssigneePicker
                    candidates={assigneeCandidates(board)}
                    selectedIds={draft.assigneeIds}
                    onChange={(assigneeIds) => set({ assigneeIds })}
                  />
                )}
              </div>
            </PropertyRow>
            <PropertyRow icon={<Calendar />} label="Due date">
              <div className="flex flex-wrap items-center gap-2">
                <OptionPicker
                  field={dueField(draft.dueInDays)}
                  onChange={(value) => set({ dueInDays: dueOf(value) })}
                  disabled={!canEdit}
                />
                {draft.dueInDays !== null && draft.dueInDays > 0 && (
                  <span className="text-sm text-ink-muted">
                    after the task is created
                  </span>
                )}
              </div>
            </PropertyRow>
            <PropertyRow icon={<Tag />} label="Labels">
              <div className="flex flex-wrap items-center gap-1.5 py-0.75">
                {draft.tags.map((tag) => (
                  <TagChip
                    key={tag}
                    tag={tag}
                    tagColors={tagColors}
                    onRemove={
                      canEdit
                        ? () =>
                            set({ tags: draft.tags.filter((t) => t !== tag) })
                        : undefined
                    }
                  />
                ))}
                {canEdit && (
                  <TagPicker
                    projectTags={board.labels}
                    selectedTags={draft.tags}
                    tagColors={tagColors}
                    onChange={(tags) => set({ tags })}
                  />
                )}
              </div>
            </PropertyRow>
          </div>

          <section className="flex flex-col gap-2 border-t border-line-soft pt-5">
            <h3 className="text-sm font-semibold text-ink">Description</h3>
            <Textarea
              value={draft.description}
              onChange={(e) => set({ description: e.target.value })}
              placeholder="What every task made from this should say"
              aria-label="Description"
              disabled={!canEdit}
              rows={3}
            />
          </section>

          <TemplateSubtasks
            subtasks={draft.subtasks}
            canEdit={canEdit}
            canAdd={canAddSubtask(draft)}
            onChange={(subtasks) => set({ subtasks })}
          />

          {uses.length > 0 && (
            <section className="flex flex-col gap-2 border-t border-line-soft pt-5">
              <h3 className="text-sm font-semibold text-ink">Used by</h3>
              {uses.map((use) => (
                <Button
                  key={use.ruleId}
                  variant="outline"
                  size={null}
                  onClick={() => onOpenRule(use.ruleId)}
                  className="h-auto min-h-11 justify-start gap-2.5 rounded-lg px-3 py-1.5 text-left font-normal whitespace-normal"
                >
                  <Repeat className="size-3.75 text-tone-blue-fg" />
                  <span className="min-w-0 flex-1 text-sm">{use.text}</span>
                  {use.next && (
                    <span className="shrink-0 text-xs text-ink-subtle">
                      {use.next}
                    </span>
                  )}
                </Button>
              ))}
            </section>
          )}
        </div>

        <footer className="flex shrink-0 items-center gap-2 border-t border-line px-5 py-3">
          {templateId && canEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="-ml-2.5 text-danger-text hover:text-danger-text"
            >
              Delete template
            </Button>
          )}
          <span className="min-w-0 flex-1 truncate text-right text-xs text-ink-subtle">
            {canEdit ? problem : ''}
          </span>
          <Button variant="outline" size="sm" onClick={onClose}>
            {canEdit ? 'Cancel' : 'Close'}
          </Button>
          {canEdit && (
            <Button
              size="sm"
              disabled={Boolean(problem) || saving}
              onClick={save}
            >
              Save template
            </Button>
          )}
        </footer>
      </SheetContent>
    </Sheet>
  );
};
