import { deleteRule } from '@/db/uniq-query/automation/rule-utils';
import { NotFoundError } from '@/lib/api/errors';
import { createParamHandle } from '@/lib/api/handle';
import { parseId } from '@/lib/api/params';
import { changeRule } from '@/lib/automation/manage';
import {
  updateRuleSchema,
  type UpdateRuleBody,
} from '@/validations/automation.validation';
import { NextResponse } from 'next/server';

type RouteParams = { id: string; ruleId: string };

/** Saves a rule again, or only turns it on or off. */
export const PATCH = createParamHandle<RouteParams, UpdateRuleBody>(
  {
    body: updateRuleSchema,
    permission: 'automation:manage',
    resolveProjectIds: ({ params }) => [parseId(params.id)],
  },
  async ({ params, body }) => {
    const updated = await changeRule(
      parseId(params.id),
      parseId(params.ruleId),
      body,
    );
    if (!updated) throw new NotFoundError('Rule not found');
    return NextResponse.json({ updated, message: 'Rule saved', status: 200 });
  },
);

export const DELETE = createParamHandle<RouteParams>(
  {
    permission: 'automation:manage',
    resolveProjectIds: ({ params }) => [parseId(params.id)],
  },
  async ({ params }) => {
    const deleted = await deleteRule(
      parseId(params.ruleId),
      parseId(params.id),
    );
    if (!deleted) throw new NotFoundError('Rule not found');
    return NextResponse.json({ deleted, message: 'Rule deleted', status: 200 });
  },
);
