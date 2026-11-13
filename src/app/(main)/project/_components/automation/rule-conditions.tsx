'use client';

import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MAX_RULE_CONDITIONS } from '@/helper/utils/automation';
import type { RuleCondition } from '@/types';
import type { BoardContext } from './automation-operations';
import { FieldRow } from './field-row';
import { conditionFields } from './rule-editor-operations';

/** Checks on the task itself: every one must hold for the rule to act. */
export const RuleConditions = ({
  conditions,
  board,
  disabled,
  onAdd,
  onField,
  onRemove,
}: {
  conditions: RuleCondition[];
  board: BoardContext;
  disabled: boolean;
  onAdd: () => void;
  onField: (index: number, key: string, value: string) => void;
  onRemove: (index: number) => void;
}) => (
  <>
    {conditions.length > 0 ? (
      <ul className="flex flex-col gap-2 rounded-lg border border-line p-3">
        {conditions.map((condition, i) => (
          // conditions have no id: their place in the list names them
          <li key={i} className="flex flex-wrap items-center gap-2">
            <FieldRow
              fields={conditionFields(condition, board)}
              onChange={(key, value) => onField(i, key, value)}
              disabled={disabled}
            />
            <div className="flex-1" />
            {!disabled && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Remove this condition"
                onClick={() => onRemove(i)}
              >
                <X className="size-3.5" />
              </Button>
            )}
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-xs leading-4.5 text-ink-subtle">
        Without a condition, the rule runs for every task.
      </p>
    )}
    {!disabled && conditions.length < MAX_RULE_CONDITIONS && (
      <Button
        variant="ghost"
        size="xs"
        onClick={onAdd}
        className="-ml-2 self-start text-sm"
      >
        <Plus />
        Add a condition
      </Button>
    )}
  </>
);
