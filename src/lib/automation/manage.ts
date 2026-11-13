import {
  boardRefsOf,
  getAutomationBoard,
  type AutomationBoard,
} from '@/db/uniq-query/automation/board-utils';
import type { HistoryFilter } from '@/db/uniq-query/automation/history-utils';
import {
  countRules,
  getRule,
  insertRule,
  listRules,
  updateRule,
} from '@/db/uniq-query/automation/rule-utils';
import {
  countTemplates,
  createTaskFromTemplate,
  getTemplate,
  insertTemplate,
  listTemplates,
  updateTemplate,
} from '@/db/uniq-query/automation/template-utils';
import {
  countWebhooks,
  getWebhook,
  insertWebhook,
  listWebhooks,
  updateWebhook,
} from '@/db/uniq-query/automation/webhook-utils';
import {
  MAX_RULES,
  MAX_TEMPLATES,
  MAX_WEBHOOKS,
  missingRef,
  ruleRefs,
} from '@/helper/utils/automation';
import { nextRunAt } from '@/helper/utils/automation-schedule';
import { pingPayload, webhookUrlProblem } from '@/helper/utils/webhook';
import { decryptSecret, encryptSecret } from '@/lib/ai/crypto';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from '@/lib/api/errors';
import { isUuid } from '@/lib/api/params';
import { isGuestSession } from '@/lib/guest';
import { authorize } from '@/lib/rbac/authorize';
import type {
  AutomationRule,
  BoardAutomation,
  RuleAction,
  RuleCondition,
  RuleTrigger,
  SaveTemplatePayload,
  TaskTemplate,
  Webhook,
} from '@/types';
import type {
  SaveRuleBody,
  SaveTemplateBody,
  SaveWebhookBody,
  TestWebhookBody,
  UpdateRuleBody,
  UpdateTemplateBody,
  UpdateWebhookBody,
} from '@/validations/automation.validation';
import type { Session } from 'next-auth';
import { allowInsecureWebhooks } from './webhook-guard';
import { postWebhook, signBody, type SendResult } from './webhook-send';

export async function boardOrThrow(
  projectId: string,
): Promise<AutomationBoard> {
  const board = await getAutomationBoard(projectId);
  if (!board) throw new NotFoundError('Board not found');
  return board;
}

/** Everyone in the demo shares one account: no requests leave on its say. */
export const refuseGuests = (session: Session) => {
  if (isGuestSession(session)) {
    throw new ForbiddenError('Sign in with Google to use webhooks');
  }
};

/** Everything the Automation view lists, for this person. */
export async function getBoardAutomation(
  projectId: string,
  userId: string,
  session: Session,
  since: Date,
): Promise<BoardAutomation> {
  const [board, canManage, canEditTemplates] = await Promise.all([
    boardOrThrow(projectId),
    authorize(userId, [projectId], 'automation:manage'),
    authorize(userId, [projectId], 'template:manage'),
  ]);
  const [rules, templates, webhooks] = await Promise.all([
    listRules(projectId, since),
    listTemplates(projectId),
    // an address can carry a token: only those who manage them see them
    canManage ? listWebhooks(projectId) : [],
  ]);
  return {
    rules,
    templates,
    webhooks,
    timeZone: board.timeZone,
    canManage,
    canEditTemplates,
    webhooksAllowed: !isGuestSession(session),
  };
}

type RuleParts = {
  trigger: RuleTrigger;
  conditions: RuleCondition[];
  actions: RuleAction[];
};

/**
 * Refuses a rule that points at something the board does not have, and
 * says when a rule on a schedule runs first (null for every other rule).
 */
const checkRule = (
  board: AutomationBoard,
  rule: RuleParts,
  now: Date,
): Date | null => {
  const problem = missingRef(ruleRefs(rule), boardRefsOf(board));
  if (problem) throw new BadRequestError(problem);
  return rule.trigger.type === 'schedule'
    ? nextRunAt(rule.trigger, board.timeZone, now)
    : null;
};

export async function createRule(
  projectId: string,
  userId: string,
  body: SaveRuleBody,
): Promise<AutomationRule> {
  const board = await boardOrThrow(projectId);
  if ((await countRules(projectId)) >= MAX_RULES) {
    throw new BadRequestError(`A board can have up to ${MAX_RULES} rules`);
  }
  const next = checkRule(board, body, new Date());
  const created = await insertRule(
    projectId,
    userId,
    { ...body, enabled: body.enabled ?? true },
    next,
  );
  return { ...created, runsThisWeek: 0 };
}

/** The whole rule again (which also mends a broken one), or only its switch. */
export async function changeRule(
  projectId: string,
  ruleId: string,
  body: UpdateRuleBody,
) {
  const existing = await getRule(ruleId, projectId);
  if (!existing) throw new NotFoundError('Rule not found');
  const now = new Date();
  if ('trigger' in body) {
    const board = await boardOrThrow(projectId);
    return updateRule(ruleId, projectId, {
      ...body,
      enabled: body.enabled ?? existing.enabled,
      nextRunAt: checkRule(board, body, now),
      brokenReason: null,
    });
  }
  // switched back on: a schedule starts from now, not from what it missed
  if (body.enabled && existing.trigger.type === 'schedule') {
    const board = await boardOrThrow(projectId);
    return updateRule(ruleId, projectId, {
      enabled: true,
      nextRunAt: nextRunAt(existing.trigger, board.timeZone, now),
    });
  }
  return updateRule(ruleId, projectId, { enabled: body.enabled });
}

/** Only people and labels the board has: the rest are dropped. */
const onBoardOnly = <T extends Partial<SaveTemplatePayload>>(
  board: AutomationBoard,
  body: T,
): T => {
  const labels = new Set(board.labels);
  const members = new Set(board.members.map((m) => m.id));
  return {
    ...body,
    ...(body.tags ? { tags: body.tags.filter((tag) => labels.has(tag)) } : {}),
    ...(body.assigneeIds
      ? { assigneeIds: body.assigneeIds.filter((id) => members.has(id)) }
      : {}),
  };
};

export async function createTemplate(
  projectId: string,
  userId: string,
  body: SaveTemplateBody,
): Promise<TaskTemplate> {
  const board = await boardOrThrow(projectId);
  if ((await countTemplates(projectId)) >= MAX_TEMPLATES) {
    throw new BadRequestError(
      `A board can have up to ${MAX_TEMPLATES} templates`,
    );
  }
  return insertTemplate(projectId, userId, onBoardOnly(board, body));
}

export async function changeTemplate(
  projectId: string,
  templateId: string,
  body: UpdateTemplateBody,
): Promise<TaskTemplate> {
  const board = await boardOrThrow(projectId);
  const updated = await updateTemplate(
    templateId,
    projectId,
    onBoardOnly(board, body),
  );
  if (!updated) throw new NotFoundError('Template not found');
  return updated;
}

/** A new task from a template, in a column of this board. */
export async function useTemplate(
  projectId: string,
  templateId: string,
  columnId: string,
) {
  const board = await boardOrThrow(projectId);
  const column = board.columns.find((c) => c.id === columnId);
  if (!column) throw new BadRequestError('That column is not on this board');
  const template = await getTemplate(templateId, projectId);
  if (!template) throw new NotFoundError('Template not found');
  const created = await createTaskFromTemplate({
    template,
    columnId,
    board,
    now: new Date(),
  });
  return {
    ...created,
    column: { id: column.id, name: column.name, color: column.color },
  };
}

const checkUrl = (url: string) => {
  const problem = webhookUrlProblem(url, allowInsecureWebhooks());
  if (problem) throw new BadRequestError(problem);
};

export async function createWebhook(
  projectId: string,
  userId: string,
  body: SaveWebhookBody,
): Promise<Webhook> {
  checkUrl(body.url);
  if ((await countWebhooks(projectId)) >= MAX_WEBHOOKS) {
    throw new BadRequestError(
      `A board can have up to ${MAX_WEBHOOKS} webhooks`,
    );
  }
  return insertWebhook({
    projectId,
    name: body.name,
    url: body.url,
    events: body.events,
    secret: encryptSecret(body.secret),
    createdBy: userId,
  });
}

export async function changeWebhook(
  projectId: string,
  webhookId: string,
  body: UpdateWebhookBody,
): Promise<Webhook> {
  if (body.url !== undefined) checkUrl(body.url);
  const updated = await updateWebhook(webhookId, projectId, body);
  if (!updated) throw new NotFoundError('Webhook not found');
  return updated;
}

/** Sends a hello to an address, saved or not, and says how it was received. */
export async function testWebhook(
  projectId: string,
  body: TestWebhookBody,
): Promise<SendResult> {
  const board = await boardOrThrow(projectId);
  let target: { url: string; secret: string };
  if ('webhookId' in body) {
    const saved = await getWebhook(body.webhookId, projectId);
    if (!saved) throw new NotFoundError('Webhook not found');
    target = { url: saved.url, secret: decryptSecret(saved.secret) };
  } else {
    target = body;
  }
  checkUrl(target.url);
  const payload = JSON.stringify(
    pingPayload({ id: board.id, name: board.name }, new Date()),
  );
  return postWebhook(target.url, payload, {
    'X-TimeCraft-Event': 'ping',
    'X-TimeCraft-Signature': signBody(target.secret, payload),
  });
}

/** `?since=` on the Automation view: the start of the viewer's week. */
export const sinceOf = (params: URLSearchParams, now: Date): Date => {
  const given = new Date(params.get('since') ?? '');
  return Number.isNaN(given.getTime())
    ? new Date(now.getTime() - 7 * 86_400_000)
    : given;
};

/** `?kind=&failed=&cursor=&rule=` on History. */
export const historyFilterOf = (params: URLSearchParams): HistoryFilter => {
  const kind = params.get('kind');
  const cursor = new Date(params.get('cursor') ?? '');
  const rule = params.get('rule');
  // one rule's runs are rule runs: no webhook messages beside them
  if (rule && isUuid(rule)) {
    return { kind: 'rules', failedOnly: false, cursor: null, ruleId: rule };
  }
  return {
    kind: kind === 'rules' || kind === 'webhooks' ? kind : 'all',
    failedOnly: params.get('failed') === '1',
    cursor: Number.isNaN(cursor.getTime()) ? null : cursor,
  };
};
