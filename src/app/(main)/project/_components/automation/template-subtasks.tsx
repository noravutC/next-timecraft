'use client';

import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { removeAt, replaceAt } from './rule-editor-operations';

/** The subtasks a task made from a template starts with: typed, in order. */
export const TemplateSubtasks = ({
  subtasks,
  canEdit,
  canAdd,
  onChange,
}: {
  subtasks: string[];
  canEdit: boolean;
  /** false once the template has as many as it can hold */
  canAdd: boolean;
  onChange: (subtasks: string[]) => void;
}) => (
  <section className="flex flex-col gap-1.5 border-t border-line-soft pt-5">
    <h3 className="pb-0.5 text-sm font-semibold text-ink">Subtasks</h3>
    <ul className="flex flex-col gap-1.5">
      {subtasks.map((subtask, i) => (
        // subtasks have no id: their place in the list names them
        <li key={i} className="flex items-center gap-2">
          <span
            aria-hidden
            className="size-4 shrink-0 rounded-full border border-line-strong"
          />
          <Input
            value={subtask}
            onChange={(e) => onChange(replaceAt(subtasks, i, e.target.value))}
            placeholder="Subtask"
            aria-label={`Subtask ${i + 1}`}
            disabled={!canEdit}
            maxLength={500}
            className="h-8 flex-1 text-sm"
          />
          {canEdit && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Remove subtask ${i + 1}`}
              onClick={() => onChange(removeAt(subtasks, i))}
            >
              <X className="size-3.5" />
            </Button>
          )}
        </li>
      ))}
    </ul>
    {canEdit && canAdd && (
      <Button
        variant="ghost"
        size="xs"
        onClick={() => onChange([...subtasks, ''])}
        className="-ml-2 self-start text-sm text-ink-subtle"
      >
        <Plus />
        Add a subtask
      </Button>
    )}
  </section>
);
