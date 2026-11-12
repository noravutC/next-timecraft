import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import type {
  automationRulesTable,
  automationRunsTable,
  taskTemplatesTable,
  webhookDeliveriesTable,
  webhooksTable,
} from '@/db/schema';
import type {
  RuleAction,
  RuleTrigger,
} from '@/db/schema/automation-rule.table';
export type {
  RuleAction,
  RuleCondition,
  RuleTrigger,
} from '@/db/schema/automation-rule.table';
export type { WebhookEvent } from '@/db/schema/webhook.table';
export type { WebhookPayload } from '@/db/schema/webhook-delivery.table';

export type AutomationRuleRow = InferSelectModel<typeof automationRulesTable>;
export type NewAutomationRuleRow = InferInsertModel<
  typeof automationRulesTable
>;
export type RuleTriggerType = RuleTrigger['type'];
export type RuleActionType = RuleAction['type'];
export type ScheduleTrigger = Extract<RuleTrigger, { type: 'schedule' }>;

/** A rule in the Rules list: with how often it ran this week. */
export type AutomationRule = AutomationRuleRow & { runsThisWeek: number };
export type SaveRulePayload = Pick<
  NewAutomationRuleRow,
  'trigger' | 'conditions' | 'actions' | 'enabled'
>;
/** A rule being written: the same parts that are saved, all of them set. */
export type RuleDraft = Pick<
  AutomationRuleRow,
  'trigger' | 'conditions' | 'actions' | 'enabled'
>;

export type TaskTemplateRow = InferSelectModel<typeof taskTemplatesTable>;
export type NewTaskTemplateRow = InferInsertModel<typeof taskTemplatesTable>;
export type TaskTemplate = TaskTemplateRow;
export type SaveTemplatePayload = Pick<
  NewTaskTemplateRow,
  | 'title'
  | 'description'
  | 'priority'
  | 'tags'
  | 'subtasks'
  | 'assigneeIds'
  | 'dueInDays'
>;

export type WebhookRow = InferSelectModel<typeof webhooksTable>;
export type NewWebhookRow = InferInsertModel<typeof webhooksTable>;
/** How its last few messages went. */
export type WebhookHealth = {
  recent: number;
  failed: number;
  lastSentAt: Date | null;
};
/** A webhook as the page sees it: never its secret. */
export type Webhook = Omit<WebhookRow, 'secret'> & { health: WebhookHealth };
export type SaveWebhookPayload = Pick<NewWebhookRow, 'name' | 'url' | 'events'>;

export type AutomationRunRow = InferSelectModel<typeof automationRunsTable>;
export type WebhookDeliveryRow = InferSelectModel<
  typeof webhookDeliveriesTable
>;

/** One line of History: a rule that ran, or a message to a webhook. */
export type HistoryItem =
  | ({ kind: 'run' } & Pick<
      AutomationRunRow,
      | 'id'
      | 'ruleId'
      | 'rule'
      | 'trigger'
      | 'taskId'
      | 'taskTitle'
      | 'status'
      | 'detail'
      | 'createdAt'
    >)
  | ({ kind: 'delivery'; webhookName: string; url: string } & Pick<
      WebhookDeliveryRow,
      | 'id'
      | 'webhookId'
      | 'event'
      | 'taskId'
      | 'taskTitle'
      | 'status'
      | 'attempts'
      | 'responseStatus'
      | 'durationMs'
      | 'error'
      | 'nextAttemptAt'
      | 'payload'
      | 'createdAt'
    >);

export interface HistoryPage {
  items: HistoryItem[];
  nextCursor: string | null;
}

/** GET /api/project/[id]/automation: everything the Automation view lists. */
export interface BoardAutomation {
  rules: AutomationRule[];
  templates: TaskTemplate[];
  webhooks: Webhook[];
  /** the zone schedule rules count in: the workspace's */
  timeZone: string;
  /** rules and webhooks: owners and admins */
  canManage: boolean;
  /** templates: anyone who can create tasks */
  canEditTemplates: boolean;
  /** off in the shared guest workspace */
  webhooksAllowed: boolean;
}
