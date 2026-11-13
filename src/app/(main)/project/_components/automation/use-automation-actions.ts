'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { countOf } from '@/helper/utils/insights';
import { ruleSentence } from '@/helper/utils/automation-text';
import { automationServices } from '@/services/automation.service';
import { useAutomationStore } from '@/store/use-automation.store';
import type { SaveTemplatePayload } from '@/types';
import type { RuleDraft, RuleIdea } from './automation-operations';
import { emptyDraft, type EditorDraft } from './rule-editor-operations';
import {
  draftOfTemplate,
  emptyTemplate,
  type TemplateDraft,
} from './template-operations';
import type { Automation } from './use-automation';
import {
  draftOfWebhook,
  emptyWebhook,
  newSecret,
  type WebhookDraft,
} from './webhook-operations';

/** The sheet that is open, if one is. `key` remounts it for each opening. */
export type OpenSheet =
  | { kind: 'rule'; key: number; ruleId: string | null; initial: EditorDraft }
  | {
      kind: 'template';
      key: number;
      templateId: string | null;
      initial: TemplateDraft;
    }
  | {
      kind: 'webhook';
      key: number;
      webhookId: string | null;
      initial: WebhookDraft;
      secret: string | null;
    }
  | null;

/** Something about to be deleted, waiting for a yes. */
export type PendingDelete = {
  kind: 'rule' | 'template' | 'webhook';
  id: string;
  title: string;
  description: string;
} | null;

const tell = (error: unknown, fallback: string) =>
  toast.error((error as { message?: string })?.message ?? fallback);

/** Everything the Automation view can do: open, save, switch, delete. */
export function useAutomationActions(
  automation: Automation,
  projectId: string | null,
) {
  const [sheet, setSheet] = useState<OpenSheet>(null);
  const [pending, setPending] = useState<PendingDelete>(null);
  const opened = useRef(0);
  const nextKey = () => (opened.current += 1);
  const store = useAutomationStore;
  const { rules, templates, webhooks, names } = automation;

  const openRule = (ruleId: string) => {
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule) return;
    const { trigger, conditions, actions, enabled } = rule;
    setSheet({
      kind: 'rule',
      key: nextKey(),
      ruleId,
      initial: { trigger, conditions, actions, enabled },
    });
  };
  const openTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;
    setSheet({
      kind: 'template',
      key: nextKey(),
      templateId,
      initial: draftOfTemplate(template),
    });
  };

  // The board can ask for something to be opened here: a rule from the note
  // about it, a new rule from "Repeat", the templates from "New task". It
  // is taken up once this board's rules have arrived.
  const { setSection } = automation;
  useEffect(
    () =>
      store.subscribe((state) => {
        const { intent } = state;
        if (!intent || state.loadedFor !== projectId) return;
        state.setIntent(null);
        if (intent.section) setSection(intent.section);
        const rule = intent.ruleId ? state.rules[intent.ruleId] : undefined;
        const initial = rule
          ? {
              trigger: rule.trigger,
              conditions: rule.conditions,
              actions: rule.actions,
              enabled: rule.enabled,
            }
          : intent.draft;
        if (!initial) return;
        setSection('rules');
        opened.current += 1;
        setSheet({
          kind: 'rule',
          key: opened.current,
          ruleId: rule?.id ?? null,
          initial,
        });
      }),
    [store, projectId, setSection],
  );

  return {
    sheet,
    pending,
    close: () => setSheet(null),
    cancelDelete: () => setPending(null),

    openRule,
    newRule: () =>
      setSheet({
        kind: 'rule',
        key: nextKey(),
        ruleId: null,
        initial: emptyDraft,
      }),
    useIdea: (idea: RuleIdea) =>
      setSheet({
        kind: 'rule',
        key: nextKey(),
        ruleId: null,
        initial: idea.draft,
      }),
    saveRule: async (draft: RuleDraft) => {
      if (sheet?.kind !== 'rule') return;
      try {
        await store.getState().saveRule(sheet.ruleId, draft);
        setSheet(null);
        toast.success('Rule saved');
      } catch (error) {
        tell(error, 'Could not save the rule');
      }
    },
    toggleRule: (ruleId: string, enabled: boolean) =>
      void store
        .getState()
        .toggleRule(ruleId, enabled)
        .catch((error) => tell(error, 'Could not change the rule')),
    askDeleteRule: (ruleId: string) => {
      const rule = rules.find((r) => r.id === ruleId);
      if (!rule) return;
      setPending({
        kind: 'rule',
        id: ruleId,
        title: 'Delete this rule?',
        description: `${ruleSentence(rule, names)} It stops running. What it already did stays in History.`,
      });
    },

    openTemplate,
    newTemplate: () =>
      setSheet({
        kind: 'template',
        key: nextKey(),
        templateId: null,
        initial: emptyTemplate,
      }),
    saveTemplate: async (payload: SaveTemplatePayload) => {
      if (sheet?.kind !== 'template') return;
      try {
        await store.getState().saveTemplate(sheet.templateId, payload);
        setSheet(null);
        toast.success('Template saved');
      } catch (error) {
        tell(error, 'Could not save the template');
      }
    },
    useTemplate: async (templateId: string, columnId: string) => {
      try {
        const task = await store
          .getState()
          .createFromTemplate(templateId, columnId);
        if (task) toast.success(`Created “${task.title}”`);
      } catch (error) {
        tell(error, 'Could not create the task');
      }
    },
    askDeleteTemplate: (templateId: string) => {
      const template = templates.find((t) => t.id === templateId);
      if (!template) return;
      const users = rules.filter((r) =>
        r.actions.some(
          (a) => a.type === 'create_task' && a.templateId === templateId,
        ),
      ).length;
      setPending({
        kind: 'template',
        id: templateId,
        title: `Delete “${template.title}”?`,
        description:
          users > 0
            ? `${countOf(users, 'rule')} ${users === 1 ? 'makes' : 'make'} tasks from it and will be paused until given another template. Tasks already made from it stay as they are.`
            : 'Tasks already made from it stay as they are.',
      });
    },

    openWebhook: (webhookId: string) => {
      const webhook = webhooks.find((w) => w.id === webhookId);
      if (!webhook) return;
      setSheet({
        kind: 'webhook',
        key: nextKey(),
        webhookId,
        initial: draftOfWebhook(webhook),
        secret: null,
      });
    },
    newWebhook: () =>
      setSheet({
        kind: 'webhook',
        key: nextKey(),
        webhookId: null,
        initial: emptyWebhook,
        secret: newSecret(),
      }),
    saveWebhook: async (draft: WebhookDraft) => {
      if (sheet?.kind !== 'webhook') return;
      const payload = {
        name: draft.name.trim(),
        url: draft.url.trim(),
        events: draft.events,
        ...(sheet.secret ? { secret: sheet.secret } : {}),
      };
      try {
        await store.getState().saveWebhook(sheet.webhookId, payload);
        setSheet(null);
        toast.success(sheet.webhookId ? 'Webhook saved' : 'Webhook added');
      } catch (error) {
        tell(error, 'Could not save the webhook');
      }
    },
    testWebhook: (draft: WebhookDraft) => {
      if (sheet?.kind !== 'webhook' || !projectId) {
        return Promise.reject(new Error('Nothing to test'));
      }
      return automationServices.testWebhook(
        projectId,
        sheet.webhookId
          ? { webhookId: sheet.webhookId }
          : { url: draft.url.trim(), secret: sheet.secret ?? '' },
      );
    },
    toggleWebhook: (webhookId: string, enabled: boolean) =>
      void store
        .getState()
        .toggleWebhook(webhookId, enabled)
        .catch((error) => tell(error, 'Could not change the webhook')),
    askDeleteWebhook: (webhookId: string) => {
      const webhook = webhooks.find((w) => w.id === webhookId);
      if (!webhook) return;
      setPending({
        kind: 'webhook',
        id: webhookId,
        title: `Delete “${webhook.name}”?`,
        description:
          'Nothing more is sent to it, and what was sent leaves History with it.',
      });
    },

    confirmDelete: () => {
      if (!pending) return;
      const { kind, id } = pending;
      const state = store.getState();
      const run =
        kind === 'rule'
          ? state.deleteRule(id)
          : kind === 'template'
            ? state.deleteTemplate(id)
            : state.deleteWebhook(id);
      void run.catch((error) => tell(error, 'Could not delete it'));
      setPending(null);
      setSheet(null);
    },
  };
}

export type AutomationActions = ReturnType<typeof useAutomationActions>;
