import apiClient from '@/lib/axios';
import type {
  APIDelete,
  APIPatch,
  APIPost,
  AutomationRule,
  AutomationRuleRow,
  BoardAutomation,
  HistoryPage,
  SaveRulePayload,
  SaveTemplatePayload,
  SaveWebhookPayload,
  TaskTemplate,
  Webhook,
} from '@/types';
import type { DuplicatedTask } from './tasks.service';

/** History as the list asks for it. */
export type HistoryQuery = {
  kind: 'all' | 'rules' | 'webhooks';
  failedOnly: boolean;
  cursor?: string | null;
  /** only this rule's runs */
  ruleId?: string;
};

/** How a test message was received. */
export type WebhookTestResult = {
  accepted: boolean;
  status: number | null;
  durationMs: number;
  error: string | null;
};

/** A webhook that is not saved yet, or a saved one. */
export type WebhookTestTarget =
  | { url: string; secret: string }
  | { webhookId: string };

class AutomationService {
  private client = apiClient;

  /** Rules, templates and webhooks; `since` is the start of the viewer's week. */
  async getBoard(projectId: string, since: Date): Promise<BoardAutomation> {
    return this.client
      .get(`/project/${projectId}/automation`, {
        params: { since: since.toISOString() },
      })
      .then((response) => response.data.data as BoardAutomation)
      .catch((error) => {
        throw error?.response?.data || new Error('Failed to load automation');
      });
  }

  async createRule(
    projectId: string,
    payload: SaveRulePayload,
  ): Promise<APIPost<AutomationRule>> {
    return this.client
      .post(`/project/${projectId}/automation/rules`, payload)
      .then((response) => response.data as APIPost<AutomationRule>)
      .catch((error) => {
        throw error?.response?.data || new Error('Failed to save the rule');
      });
  }

  /** The whole rule again, or only its switch. */
  async updateRule(
    projectId: string,
    ruleId: string,
    payload: SaveRulePayload | { enabled: boolean },
  ): Promise<APIPatch<AutomationRuleRow>> {
    return this.client
      .patch(`/project/${projectId}/automation/rules/${ruleId}`, payload)
      .then((response) => response.data as APIPatch<AutomationRuleRow>)
      .catch((error) => {
        throw error?.response?.data || new Error('Failed to save the rule');
      });
  }

  async deleteRule(
    projectId: string,
    ruleId: string,
  ): Promise<APIDelete<boolean>> {
    return this.client
      .delete(`/project/${projectId}/automation/rules/${ruleId}`)
      .then((response) => response.data as APIDelete<boolean>)
      .catch((error) => {
        throw error?.response?.data || new Error('Failed to delete the rule');
      });
  }

  /** A board's templates alone: what "New task" offers. */
  async listTemplates(projectId: string): Promise<TaskTemplate[]> {
    return this.client
      .get(`/project/${projectId}/templates`)
      .then((response) => response.data.data as TaskTemplate[])
      .catch((error) => {
        throw error?.response?.data || new Error('Failed to load templates');
      });
  }

  async createTemplate(
    projectId: string,
    payload: SaveTemplatePayload,
  ): Promise<APIPost<TaskTemplate>> {
    return this.client
      .post(`/project/${projectId}/templates`, payload)
      .then((response) => response.data as APIPost<TaskTemplate>)
      .catch((error) => {
        throw error?.response?.data || new Error('Failed to save the template');
      });
  }

  async updateTemplate(
    projectId: string,
    templateId: string,
    payload: Partial<SaveTemplatePayload>,
  ): Promise<APIPatch<TaskTemplate>> {
    return this.client
      .patch(`/project/${projectId}/templates/${templateId}`, payload)
      .then((response) => response.data as APIPatch<TaskTemplate>)
      .catch((error) => {
        throw error?.response?.data || new Error('Failed to save the template');
      });
  }

  async deleteTemplate(
    projectId: string,
    templateId: string,
  ): Promise<APIDelete<boolean>> {
    return this.client
      .delete(`/project/${projectId}/templates/${templateId}`)
      .then((response) => response.data as APIDelete<boolean>)
      .catch((error) => {
        throw (
          error?.response?.data || new Error('Failed to delete the template')
        );
      });
  }

  /** A new task from a template, at the end of a column. */
  async useTemplate(
    projectId: string,
    templateId: string,
    columnId: string,
  ): Promise<DuplicatedTask> {
    return this.client
      .post(`/project/${projectId}/templates/${templateId}/use`, { columnId })
      .then((response) => response.data as DuplicatedTask)
      .catch((error) => {
        throw error?.response?.data || new Error('Failed to create the task');
      });
  }

  async createWebhook(
    projectId: string,
    payload: SaveWebhookPayload & { secret: string },
  ): Promise<APIPost<Webhook>> {
    return this.client
      .post(`/project/${projectId}/webhooks`, payload)
      .then((response) => response.data as APIPost<Webhook>)
      .catch((error) => {
        throw error?.response?.data || new Error('Failed to add the webhook');
      });
  }

  async updateWebhook(
    projectId: string,
    webhookId: string,
    payload: Partial<SaveWebhookPayload> & { enabled?: boolean },
  ): Promise<APIPatch<Webhook>> {
    return this.client
      .patch(`/project/${projectId}/webhooks/${webhookId}`, payload)
      .then((response) => response.data as APIPatch<Webhook>)
      .catch((error) => {
        throw error?.response?.data || new Error('Failed to save the webhook');
      });
  }

  async deleteWebhook(
    projectId: string,
    webhookId: string,
  ): Promise<APIDelete<boolean>> {
    return this.client
      .delete(`/project/${projectId}/webhooks/${webhookId}`)
      .then((response) => response.data as APIDelete<boolean>)
      .catch((error) => {
        throw (
          error?.response?.data || new Error('Failed to delete the webhook')
        );
      });
  }

  async testWebhook(
    projectId: string,
    target: WebhookTestTarget,
  ): Promise<WebhookTestResult> {
    return this.client
      .post(`/project/${projectId}/webhooks/test`, target)
      .then((response) => response.data.data as WebhookTestResult)
      .catch((error) => {
        throw error?.response?.data || new Error('Failed to send the test');
      });
  }

  async getHistory(
    projectId: string,
    query: HistoryQuery,
  ): Promise<HistoryPage> {
    return this.client
      .get(`/project/${projectId}/automation/history`, {
        params: {
          kind: query.kind,
          ...(query.failedOnly ? { failed: 1 } : {}),
          ...(query.cursor ? { cursor: query.cursor } : {}),
          ...(query.ruleId ? { rule: query.ruleId } : {}),
        },
      })
      .then((response) => response.data.data as HistoryPage)
      .catch((error) => {
        throw error?.response?.data || new Error('Failed to load history');
      });
  }

  /** "Send again now" for a message that was not accepted. */
  async redeliver(projectId: string, deliveryId: string): Promise<void> {
    return this.client
      .post(`/project/${projectId}/automation/deliveries/${deliveryId}`)
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data || new Error('Failed to send it again');
      });
  }
}

export const automationServices = new AutomationService();
