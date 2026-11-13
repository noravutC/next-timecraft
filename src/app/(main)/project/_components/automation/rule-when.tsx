'use client';

import { Button } from '@/components/ui/button';
import {
  TRIGGER_GROUP_CAPTIONS,
  TRIGGERS,
  type TriggerGroup,
} from '@/helper/utils/automation';
import { cn } from '@/lib/utils';
import type { RuleTrigger, RuleTriggerType } from '@/types';
import { TRIGGER_ICONS } from './automation-icons';
import type { BoardContext } from './automation-operations';
import { FieldRow } from './field-row';
import { OptionPicker } from './option-picker';
import {
  scheduleNote,
  triggerFields,
  triggerOptions,
  weekdayPills,
} from './rule-editor-operations';

const GROUPS: TriggerGroup[] = ['task', 'date', 'time'];
const GROUP_TONES: Record<TriggerGroup, string> = {
  task: 'bg-tone-violet text-tone-violet-fg',
  date: 'bg-tone-orange text-tone-orange-fg',
  time: 'bg-tone-blue text-tone-blue-fg',
};

/**
 * What starts the rule. Before one is picked it lists every trigger;
 * after, the pick and its values.
 */
export const RuleWhen = ({
  trigger,
  board,
  timeZone,
  disabled,
  onPick,
  onField,
  onWeekday,
}: {
  trigger: RuleTrigger | null;
  board: BoardContext;
  timeZone: string;
  disabled: boolean;
  onPick: (type: RuleTriggerType) => void;
  onField: (key: string, value: string) => void;
  onWeekday: (day: number) => void;
}) => {
  if (!trigger) {
    return GROUPS.map((group) => (
      <div key={group} className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-ink-subtle">
          {TRIGGER_GROUP_CAPTIONS[group]}
        </span>
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(15rem,100%),1fr))] gap-2">
          {TRIGGERS.filter((t) => t.group === group).map((t) => {
            const Icon = TRIGGER_ICONS[t.type];
            return (
              <li key={t.type} className="flex">
                <Button
                  variant="outline"
                  size={null}
                  onClick={() => onPick(t.type)}
                  className="h-auto w-full justify-start gap-2.5 rounded-lg px-2.5 py-2 text-left"
                >
                  <span
                    aria-hidden
                    className={cn(
                      'grid size-7 shrink-0 place-items-center rounded-md',
                      GROUP_TONES[group],
                    )}
                  >
                    <Icon className="size-3.75" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm font-medium text-ink">
                      {t.title}
                    </span>
                    <span className="text-xs font-normal text-ink-subtle">
                      {t.hint}
                    </span>
                  </span>
                </Button>
              </li>
            );
          })}
        </ul>
      </div>
    ));
  }

  const fields = triggerFields(trigger, board);
  const TriggerIcon = TRIGGER_ICONS[trigger.type];
  return (
    <div className="flex flex-col gap-2.5 rounded-lg border border-line p-3">
      <OptionPicker
        field={{
          key: 'type',
          label: 'What starts the rule',
          value: trigger.type,
          options: triggerOptions,
        }}
        onChange={(type) => onPick(type as RuleTriggerType)}
        disabled={disabled}
        leading={<TriggerIcon className="size-3.75 text-ink-muted" />}
        className="h-9 w-full"
      />
      {fields.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <FieldRow fields={fields} onChange={onField} disabled={disabled} />
        </div>
      )}
      {trigger.type === 'schedule' && trigger.every === 'week' && (
        <div
          role="group"
          aria-label="Days of the week"
          className="flex flex-wrap items-center gap-1.5"
        >
          <span className="mr-0.5 text-sm text-ink-muted">On</span>
          {weekdayPills(trigger).map((pill) => (
            <Button
              key={pill.day}
              variant={pill.on ? 'default' : 'outline'}
              size="icon"
              aria-pressed={pill.on}
              aria-label={pill.name}
              disabled={disabled}
              onClick={() => onWeekday(pill.day)}
              className="rounded-full text-xs"
            >
              {pill.letter}
            </Button>
          ))}
        </div>
      )}
      {trigger.type === 'schedule' && (
        <p className="text-xs leading-4.5 text-ink-subtle">
          {scheduleNote(trigger, timeZone, new Date())}
        </p>
      )}
    </div>
  );
};
