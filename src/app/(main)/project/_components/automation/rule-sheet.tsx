'use client';

import { ArrowRight, Check, Filter, TriangleAlert, Zap } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { triggerHasActor } from '@/helper/utils/automation';
import { ruleSentence, type RuleNames } from '@/helper/utils/automation-text';
import { cn } from '@/lib/utils';
import type { TaskTemplate } from '@/types';
import type { BoardContext, RuleDraft } from './automation-operations';
import { RuleActions } from './rule-actions';
import { RuleConditions } from './rule-conditions';
import {
  addableActions,
  draftProblem,
  type EditorDraft,
} from './rule-editor-operations';
import { RuleStep } from './rule-step';
import { RuleWhen } from './rule-when';
import { useRuleDraft } from './use-rule-draft';
import { useRuleRuns } from './use-rule-runs';

/**
 * A rule being written or changed: When, Only if, Then, and the whole
 * thing in plain words. Mounted fresh for each rule it opens.
 */
export const RuleSheet = ({
  projectId,
  ruleId,
  initial,
  brokenReason,
  board,
  names,
  templates,
  timeZone,
  canManage,
  onClose,
  onSave,
  onDelete,
  onHistory,
  onEditTemplate,
}: {
  projectId: string | null;
  /** null for a rule that is not saved yet */
  ruleId: string | null;
  initial: EditorDraft;
  /** why the saved rule is paused, if it is */
  brokenReason: string | null;
  board: BoardContext;
  names: RuleNames;
  templates: Record<string, TaskTemplate>;
  timeZone: string;
  canManage: boolean;
  onClose: () => void;
  onSave: (draft: RuleDraft) => Promise<void>;
  onDelete: () => void;
  onHistory: () => void;
  onEditTemplate: (templateId: string) => void;
}) => {
  const editor = useRuleDraft(initial);
  const { draft } = editor;
  const { trigger } = draft;
  const runs = useRuleRuns(projectId, ruleId);
  const [saving, setSaving] = useState(false);
  const problem = draftProblem(draft, board);
  const disabled = !canManage;

  const save = async () => {
    if (!trigger || problem) return;
    setSaving(true);
    try {
      await onSave({ ...draft, trigger });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent aria-describedby={undefined} className="gap-0 sm:max-w-160">
        <header className="flex h-13 shrink-0 items-center gap-2.5 border-b border-line pr-14 pl-5">
          <SheetTitle className="flex-1 text-base font-semibold">
            {ruleId ? 'Edit rule' : 'New rule'}
          </SheetTitle>
          {trigger && (
            <>
              <span className="text-xs text-ink-subtle">
                {draft.enabled ? 'On' : 'Off'}
              </span>
              <Switch
                checked={draft.enabled}
                onCheckedChange={editor.setEnabled}
                disabled={disabled}
                aria-label="Rule is on"
              />
            </>
          )}
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5">
          {brokenReason && (
            <p
              role="alert"
              className="mb-4 flex items-start gap-2.5 rounded-lg bg-warning-soft px-3 py-2.5 text-sm leading-5 text-warning-text"
            >
              <TriangleAlert
                aria-hidden
                className="mt-0.5 size-3.75 shrink-0"
              />
              <span>
                {brokenReason}, so this rule is paused. Change it and save to
                start it again.
              </span>
            </p>
          )}
          <RuleStep
            icon={Zap}
            title="When"
            hint={trigger ? undefined : 'pick what starts the rule'}
          >
            <RuleWhen
              trigger={trigger}
              board={board}
              timeZone={timeZone}
              disabled={disabled}
              onPick={editor.pickTrigger}
              onField={editor.setTriggerField}
              onWeekday={editor.toggleWeekday}
            />
          </RuleStep>
          {trigger && trigger.type !== 'schedule' && (
            <RuleStep icon={Filter} title="Only if" hint="optional" optional>
              <RuleConditions
                conditions={draft.conditions}
                board={board}
                disabled={disabled}
                onAdd={editor.addCondition}
                onField={editor.setConditionField}
                onRemove={editor.removeCondition}
              />
            </RuleStep>
          )}
          <RuleStep
            icon={ArrowRight}
            title="Then"
            hint={
              draft.actions.length > 0
                ? undefined
                : 'pick one or more things to do'
            }
            last
          >
            <RuleActions
              actions={draft.actions}
              addable={addableActions(draft)}
              board={board}
              templates={templates}
              hasActor={trigger ? triggerHasActor(trigger.type) : true}
              disabled={disabled}
              onAdd={editor.addAction}
              onField={editor.setActionField}
              onRemove={editor.removeAction}
              onEditTemplate={onEditTemplate}
            />
          </RuleStep>

          {trigger && draft.actions.length > 0 && (
            <div className="flex flex-col gap-1 rounded-lg border border-line-soft bg-surface px-3.5 py-3">
              <span className="text-xs font-medium text-ink-subtle">
                In plain words
              </span>
              <p className="text-base leading-5.5 text-ink">
                {ruleSentence({ ...draft, trigger }, names)}
              </p>
            </div>
          )}

          {runs.length > 0 && (
            <section aria-label="Last runs" className="flex flex-col pt-5">
              <div className="flex items-center gap-2 pb-1.5">
                <h3 className="flex-1 text-sm font-semibold text-ink">
                  Last runs
                </h3>
                <Button
                  variant="link"
                  size={null}
                  onClick={onHistory}
                  className="h-auto p-0 text-xs font-normal underline"
                >
                  See all in History
                </Button>
              </div>
              <ul className="flex flex-col">
                {runs.map((run) => (
                  <li
                    key={run.id}
                    className="flex min-h-8 items-center gap-2 border-t border-line-soft"
                  >
                    {run.ok ? (
                      <Check
                        aria-hidden
                        className="size-3.5 shrink-0 text-success-text"
                      />
                    ) : (
                      <TriangleAlert
                        aria-hidden
                        className="size-3.5 shrink-0 text-warning-text"
                      />
                    )}
                    <span className="min-w-0 flex-1 truncate text-sm text-ink">
                      {run.text}
                    </span>
                    <span className="shrink-0 text-xs text-ink-subtle">
                      {run.when}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <footer className="flex shrink-0 items-center gap-2 border-t border-line px-5 py-3">
          {ruleId && canManage && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="-ml-2.5 text-danger-text hover:text-danger-text"
            >
              Delete rule
            </Button>
          )}
          <span
            className={cn(
              'min-w-0 flex-1 truncate text-xs text-ink-subtle',
              ruleId && canManage && 'text-right',
            )}
          >
            {canManage
              ? problem
              : 'Only owners and admins of the board can change rules.'}
          </span>
          <Button variant="outline" size="sm" onClick={onClose}>
            {canManage ? 'Cancel' : 'Close'}
          </Button>
          {canManage && (
            <Button
              size="sm"
              disabled={Boolean(problem) || saving}
              onClick={save}
            >
              Save rule
            </Button>
          )}
        </footer>
      </SheetContent>
    </Sheet>
  );
};
