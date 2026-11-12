import { createParamHandle } from '@/lib/api/handle';
import { parseId } from '@/lib/api/params';
import { createRule } from '@/lib/automation/manage';
import {
  saveRuleSchema,
  type SaveRuleBody,
} from '@/validations/automation.validation';
import { NextResponse } from 'next/server';

type RouteParams = { id: string };

/** A new rule on this board. */
export const POST = createParamHandle<RouteParams, SaveRuleBody>(
  {
    body: saveRuleSchema,
    permission: 'automation:manage',
    resolveProjectIds: ({ params }) => [parseId(params.id)],
  },
  async ({ params, body, userId }) => {
    const created = await createRule(parseId(params.id), userId, body);
    return NextResponse.json(
      { created, message: 'Rule saved', status: 201 },
      { status: 201 },
    );
  },
);
