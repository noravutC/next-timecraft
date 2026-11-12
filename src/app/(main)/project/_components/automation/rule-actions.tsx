'use client';

import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MAX_RULE_ACTIONS } from '@/helper/utils/automation';
import type { RuleAction, RuleActionType, TaskTemplate } from '@/types';
import { ACTION_ICONS } from './automation-icons';
import type { BoardContext } from './automation-operations';
import { FieldRow } from './field-row';
import {
  actionFields,
  actionLabel,
  COMMENT_NOTE,
  templateNote,
} from './rule-editor-operations';

/**
 * What the rule does, in order. With nothing picked it lists every step
 * this trigger can be followed by; after, the steps and a way to add more.
 */
export const RuleActions = ({
  actions,
  addable,
  board,
  templates,
  hasActor,
  disabled,
  onAdd,
  onField,
  onRemove,
  onEditTemplate,
}: {
  actions: RuleAction[];
  /** the steps that can still be added */
  addable: { type: RuleActionType; title: string }[];
  board: BoardContext;
  templates: Record<string, TaskTemplate>;
  /** someone makes the change that starts the rule */
  hasActor: boolean;
  disabled: boolean;
  onAdd: (type: RuleActionType) => void;
  onField: (index: number, key: string, value: string) => void;
  onRemove: (index: number) => void;
  onEditTemplate: (templateId: string) => void;
}) => {
  if (actions.length === 0) {
    return (
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(15rem,100%),1fr))] gap-2">
        {addable.map(({ type, title }) => {
          const Icon = ACTION_ICONS[type];
          return (
            <li key={type} className="flex">
              <Button
                variant="outline"
                size={null}
                disabled={disabled}
                onClick={() => onAdd(type)}
                className="h-10 w-full justify-start gap-2.5 rounded-lg px-2.5 text-left"
              >
                <Icon className="size-3.75 text-ink-muted" />
                {title}
              </Button>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <>
      <ul className="flex flex-col rounded-lg border border-line px-3">
        {actions.map((action, i) => {
          const Icon = ACTION_ICONS[action.type];
          const note =
            action.type === 'create_task'
              ? templateNote(templates[action.templateId], board)
              : action.type === 'comment'
                ? COMMENT_NOTE
                : null;
          return (
            // steps have no id: their place in the list names them
            <li
              key={i}
              className="flex flex-col gap-1.5 border-t border-line-soft py-2.5 first:border-t-0"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Icon aria-hidden className="size-3.75 text-ink-muted" />
                <span className="text-sm font-medium text-ink">
                  {actionLabel(action.type)}
                </span>
                <FieldRow
                  fields={actionFields(action, board, hasActor)}
                  onChange={(key, value) => onField(i, key, value)}
                  disabled={disabled}
                />
                <div className="flex-1" />
                {!disabled && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove this step"
                    onClick={() => onRemove(i)}
                  >
                    <X className="size-3.5" />
                  </Button>
                )}
              </div>
              {note && (
                <p className="pl-5.75 text-xs leading-4.5 text-ink-subtle">
                  {note}{' '}
                  {action.type === 'create_task' && (
                    <Button
                      variant="link"
                      size={null}
                      onClick={() => onEditTemplate(action.templateId)}
                      className="h-auto p-0 text-xs font-normal underline"
                    >
                      Edit template
                    </Button>
                  )}
                </p>
              )}
            </li>
          );
        })}
      </ul>
      {!disabled && addable.length > 0 && actions.length < MAX_RULE_ACTIONS && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size={null}
              className="h-9 w-full rounded-lg border-dashed border-line-strong text-ink-muted"
            >
              <Plus className="size-3.5" />
              Add another action
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            {addable.map(({ type, title }) => {
              const Icon = ACTION_ICONS[type];
              return (
                <DropdownMenuItem key={type} onSelect={() => onAdd(type)}>
                  <Icon />
                  {title}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </>
  );
};
