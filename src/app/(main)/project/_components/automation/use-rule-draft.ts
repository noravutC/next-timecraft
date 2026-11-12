'use client';

import { useState } from 'react';
import type { RuleActionType, RuleTriggerType } from '@/types';
import {
  newAction,
  newCondition,
  removeAt,
  replaceAt,
  toggleWeekday,
  withActionField,
  withConditionField,
  withTrigger,
  withTriggerField,
  type EditorDraft,
} from './rule-editor-operations';

/** A rule while it is being written, and every way the editor changes it. */
export function useRuleDraft(initial: EditorDraft) {
  const [draft, setDraft] = useState(initial);
  return {
    draft,
    pickTrigger: (type: RuleTriggerType) =>
      setDraft((d) => withTrigger(d, type)),
    setTriggerField: (key: string, value: string) =>
      setDraft((d) =>
        d.trigger
          ? { ...d, trigger: withTriggerField(d.trigger, key, value) }
          : d,
      ),
    toggleWeekday: (day: number) =>
      setDraft((d) =>
        d.trigger?.type === 'schedule'
          ? { ...d, trigger: toggleWeekday(d.trigger, day) }
          : d,
      ),
    addCondition: () =>
      setDraft((d) => ({
        ...d,
        conditions: [...d.conditions, newCondition()],
      })),
    setConditionField: (index: number, key: string, value: string) =>
      setDraft((d) => ({
        ...d,
        conditions: replaceAt(
          d.conditions,
          index,
          withConditionField(d.conditions[index], key, value),
        ),
      })),
    removeCondition: (index: number) =>
      setDraft((d) => ({ ...d, conditions: removeAt(d.conditions, index) })),
    addAction: (type: RuleActionType) =>
      setDraft((d) => ({ ...d, actions: [...d.actions, newAction(type)] })),
    setActionField: (index: number, key: string, value: string) =>
      setDraft((d) => ({
        ...d,
        actions: replaceAt(
          d.actions,
          index,
          withActionField(d.actions[index], key, value),
        ),
      })),
    removeAction: (index: number) =>
      setDraft((d) => ({ ...d, actions: removeAt(d.actions, index) })),
    setEnabled: (enabled: boolean) => setDraft((d) => ({ ...d, enabled })),
  };
}
