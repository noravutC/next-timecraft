import { create } from 'zustand';
import { toRecord } from '@/helper/utils/object';
import { automationServices } from '@/services/automation.service';
import { useAssigneeStore } from '@/store/use-assignee.store';
import { useSubtaskStore } from '@/store/use-subtask.store';
import { useTaskStore } from '@/store/use-task.store';
import type {
  AutomationRule,
  RuleDraft,
  SaveRulePayload,
  SaveTemplatePayload,
  SaveWebhookPayload,
  TaskCache,
  TaskTemplate,
  Webhook,
} from '@/types';
import type { LoaderStatus } from '@/types/global/types';

/** A section to land on, a rule to open, or a new rule already filled in. */
export type AutomationIntent = {
  section?: 'rules' | 'templates' | 'webhooks' | 'history';
  ruleId?: string;
  draft?: RuleDraft;
};

interface AutomationState {
  /** the board everything below belongs to */
  projectId: string | null;
  /** the board whose rules, templates and webhooks have all arrived */
  loadedFor: string | null;
  rules: Record<string, AutomationRule>;
  templates: Record<string, TaskTemplate>;
  webhooks: Record<string, Webhook>;
  /** the zone schedule rules count in: the workspace's */
  timeZone: string;
  canManage: boolean;
  canEditTemplates: boolean;
  webhooksAllowed: boolean;
  status: LoaderStatus;
  /** what to open when the Automation view shows next: set from the board */
  intent: AutomationIntent | null;
  setIntent: (intent: AutomationIntent | null) => void;

  /** Points the store at a board, dropping another board's data. */
  useBoard: (projectId: string) => void;
  /** Rules, templates and webhooks of a board, with runs counted since `since`. */
  fetchBoard: (projectId: string, since: Date) => Promise<void>;
  /** Templates alone: what the board's "New task" menu offers. */
  fetchTemplates: (projectId: string) => Promise<void>;

  /** A new rule when `ruleId` is null, else the whole rule saved again. */
  saveRule: (ruleId: string | null, payload: SaveRulePayload) => Promise<void>;
  toggleRule: (ruleId: string, enabled: boolean) => Promise<void>;
  deleteRule: (ruleId: string) => Promise<void>;

  saveTemplate: (
    templateId: string | null,
    payload: SaveTemplatePayload,
  ) => Promise<TaskTemplate | null>;
  deleteTemplate: (templateId: string) => Promise<void>;
  /** A new task from a template, shown on the board right away. */
  createFromTemplate: (
    templateId: string,
    columnId: string,
  ) => Promise<TaskCache | null>;

  saveWebhook: (
    webhookId: string | null,
    payload: SaveWebhookPayload & { secret?: string },
  ) => Promise<void>;
  toggleWebhook: (webhookId: string, enabled: boolean) => Promise<void>;
  deleteWebhook: (webhookId: string) => Promise<void>;
}

/**
 * The record with one entry replaced, unless that entry is gone: an answer
 * that arrives after its rule was deleted must not bring the rule back.
 */
const replaceIn = <T>(record: Record<string, T>, id: string, value: T) =>
  record[id] ? { ...record, [id]: value } : record;

const without = <T>(record: Record<string, T>, id: string) => {
  const next = { ...record };
  delete next[id];
  return next;
};

export const useAutomationStore = create<AutomationState>((set, get) => ({
  projectId: null,
  loadedFor: null,
  rules: {},
  templates: {},
  webhooks: {},
  timeZone: 'UTC',
  canManage: false,
  canEditTemplates: false,
  webhooksAllowed: false,
  status: 'none',
  intent: null,
  setIntent: (intent) => set({ intent }),

  useBoard: (projectId) => {
    // another board's rules must not show while this one loads
    if (get().projectId === projectId) return;
    set({
      projectId,
      loadedFor: null,
      rules: {},
      templates: {},
      webhooks: {},
    });
  },

  fetchBoard: async (projectId, since) => {
    get().useBoard(projectId);
    set({ status: 'fetching' });
    try {
      const data = await automationServices.getBoard(projectId, since);
      if (get().projectId !== projectId) return;
      set({
        rules: toRecord(data.rules, 'id'),
        templates: toRecord(data.templates, 'id'),
        webhooks: toRecord(data.webhooks, 'id'),
        timeZone: data.timeZone,
        canManage: data.canManage,
        canEditTemplates: data.canEditTemplates,
        webhooksAllowed: data.webhooksAllowed,
        loadedFor: projectId,
        status: 'none',
      });
    } catch (error) {
      if (get().projectId === projectId) set({ status: 'error' });
      throw error;
    }
  },

  fetchTemplates: async (projectId) => {
    get().useBoard(projectId);
    const templates = await automationServices.listTemplates(projectId);
    if (get().projectId !== projectId) return;
    set({ templates: toRecord(templates, 'id') });
  },

  saveRule: async (ruleId, payload) => {
    const { projectId, rules } = get();
    if (!projectId) return;
    if (!ruleId) {
      set({ status: 'creating' });
      try {
        const { created } = await automationServices.createRule(
          projectId,
          payload,
        );
        set((state) => ({
          status: 'none',
          rules: created
            ? { ...state.rules, [created.id]: created }
            : state.rules,
        }));
      } catch (error) {
        set({ status: 'error' });
        throw error;
      }
      return;
    }
    const snapshot = rules[ruleId];
    if (!snapshot) return;
    // saving a rule again also mends it, so it shows as mended right away
    set({
      rules: {
        ...rules,
        [ruleId]: { ...snapshot, ...payload, brokenReason: null },
      },
    });
    try {
      const { updated } = await automationServices.updateRule(
        projectId,
        ruleId,
        payload,
      );
      if (updated) {
        set((state) => ({
          rules: replaceIn(state.rules, ruleId, {
            ...updated,
            runsThisWeek: snapshot.runsThisWeek,
          }),
        }));
      }
    } catch (error) {
      set((state) => ({ rules: replaceIn(state.rules, ruleId, snapshot) }));
      throw error;
    }
  },

  toggleRule: async (ruleId, enabled) => {
    const { projectId, rules } = get();
    const snapshot = rules[ruleId];
    if (!projectId || !snapshot) return;
    set({ rules: { ...rules, [ruleId]: { ...snapshot, enabled } } });
    try {
      const { updated } = await automationServices.updateRule(
        projectId,
        ruleId,
        { enabled },
      );
      if (updated) {
        // a schedule switched back on gets a new next time
        set((state) => ({
          rules: replaceIn(state.rules, ruleId, {
            ...updated,
            runsThisWeek: snapshot.runsThisWeek,
          }),
        }));
      }
    } catch (error) {
      set((state) => ({ rules: replaceIn(state.rules, ruleId, snapshot) }));
      throw error;
    }
  },

  deleteRule: async (ruleId) => {
    const { projectId, rules } = get();
    const snapshot = rules[ruleId];
    if (!projectId || !snapshot) return;
    set({ rules: without(rules, ruleId) });
    try {
      await automationServices.deleteRule(projectId, ruleId);
    } catch (error) {
      set((state) => ({ rules: { ...state.rules, [ruleId]: snapshot } }));
      throw error;
    }
  },

  saveTemplate: async (templateId, payload) => {
    const { projectId, templates } = get();
    if (!projectId) return null;
    if (!templateId) {
      set({ status: 'creating' });
      try {
        const { created } = await automationServices.createTemplate(
          projectId,
          payload,
        );
        set((state) => ({
          status: 'none',
          templates: created
            ? { ...state.templates, [created.id]: created }
            : state.templates,
        }));
        return created;
      } catch (error) {
        set({ status: 'error' });
        throw error;
      }
    }
    const snapshot = templates[templateId];
    if (!snapshot) return null;
    set({
      templates: { ...templates, [templateId]: { ...snapshot, ...payload } },
    });
    try {
      const { updated } = await automationServices.updateTemplate(
        projectId,
        templateId,
        payload,
      );
      if (updated) {
        set((state) => ({
          templates: replaceIn(state.templates, templateId, updated),
        }));
      }
      return updated;
    } catch (error) {
      set((state) => ({
        templates: replaceIn(state.templates, templateId, snapshot),
      }));
      throw error;
    }
  },

  deleteTemplate: async (templateId) => {
    const { projectId, templates } = get();
    const snapshot = templates[templateId];
    if (!projectId || !snapshot) return;
    set({ templates: without(templates, templateId) });
    try {
      await automationServices.deleteTemplate(projectId, templateId);
    } catch (error) {
      set((state) => ({
        templates: { ...state.templates, [templateId]: snapshot },
      }));
      throw error;
    }
  },

  createFromTemplate: async (templateId, columnId) => {
    const { projectId } = get();
    if (!projectId) return null;
    const response = await automationServices.useTemplate(
      projectId,
      templateId,
      columnId,
    );
    const task = response.created;
    if (!task) return null;
    useTaskStore.getState().addTasksFromRealtime([task]);
    useAssigneeStore.getState().ingestMany({ [task.id]: response.assignees });
    useSubtaskStore.getState().ingestProgress(response.subtasks);
    set((state) => {
      const template = state.templates[templateId];
      return template
        ? {
            templates: {
              ...state.templates,
              [templateId]: { ...template, usedCount: template.usedCount + 1 },
            },
          }
        : state;
    });
    return task;
  },

  saveWebhook: async (webhookId, payload) => {
    const { projectId, webhooks } = get();
    if (!projectId) return;
    if (!webhookId) {
      if (!payload.secret) return;
      set({ status: 'creating' });
      try {
        const { created } = await automationServices.createWebhook(projectId, {
          ...payload,
          secret: payload.secret,
        });
        set((state) => ({
          status: 'none',
          webhooks: created
            ? { ...state.webhooks, [created.id]: created }
            : state.webhooks,
        }));
      } catch (error) {
        set({ status: 'error' });
        throw error;
      }
      return;
    }
    const snapshot = webhooks[webhookId];
    if (!snapshot) return;
    const { name, url, events } = payload;
    set({
      webhooks: {
        ...webhooks,
        [webhookId]: { ...snapshot, name, url, events: events ?? [] },
      },
    });
    try {
      const { updated } = await automationServices.updateWebhook(
        projectId,
        webhookId,
        { name, url, events },
      );
      if (updated) {
        set((state) => ({
          webhooks: replaceIn(state.webhooks, webhookId, updated),
        }));
      }
    } catch (error) {
      set((state) => ({
        webhooks: replaceIn(state.webhooks, webhookId, snapshot),
      }));
      throw error;
    }
  },

  toggleWebhook: async (webhookId, enabled) => {
    const { projectId, webhooks } = get();
    const snapshot = webhooks[webhookId];
    if (!projectId || !snapshot) return;
    set({ webhooks: { ...webhooks, [webhookId]: { ...snapshot, enabled } } });
    try {
      await automationServices.updateWebhook(projectId, webhookId, { enabled });
    } catch (error) {
      set((state) => ({
        webhooks: replaceIn(state.webhooks, webhookId, snapshot),
      }));
      throw error;
    }
  },

  deleteWebhook: async (webhookId) => {
    const { projectId, webhooks } = get();
    const snapshot = webhooks[webhookId];
    if (!projectId || !snapshot) return;
    set({ webhooks: without(webhooks, webhookId) });
    try {
      await automationServices.deleteWebhook(projectId, webhookId);
    } catch (error) {
      set((state) => ({
        webhooks: { ...state.webhooks, [webhookId]: snapshot },
      }));
      throw error;
    }
  },
}));
