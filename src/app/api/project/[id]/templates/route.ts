import { listTemplates } from '@/db/uniq-query/automation/template-utils';
import { createParamHandle } from '@/lib/api/handle';
import { parseId } from '@/lib/api/params';
import { createTemplate } from '@/lib/automation/manage';
import {
  saveTemplateSchema,
  type SaveTemplateBody,
} from '@/validations/automation.validation';
import { NextResponse } from 'next/server';

type RouteParams = { id: string };

/** A board's task templates: what "New task" offers. */
export const GET = createParamHandle<RouteParams>(
  {
    permission: 'project:view',
    resolveProjectIds: ({ params }) => [parseId(params.id)],
  },
  async ({ params }) => {
    const data = await listTemplates(parseId(params.id));
    return NextResponse.json({ data, message: 'Templates', status: 200 });
  },
);

export const POST = createParamHandle<RouteParams, SaveTemplateBody>(
  {
    body: saveTemplateSchema,
    permission: 'template:manage',
    resolveProjectIds: ({ params }) => [parseId(params.id)],
  },
  async ({ params, body, userId }) => {
    const created = await createTemplate(parseId(params.id), userId, body);
    return NextResponse.json(
      { created, message: 'Template saved', status: 201 },
      { status: 201 },
    );
  },
);
