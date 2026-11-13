import { deleteTemplate } from '@/db/uniq-query/automation/template-utils';
import { NotFoundError } from '@/lib/api/errors';
import { createParamHandle } from '@/lib/api/handle';
import { parseId } from '@/lib/api/params';
import { changeTemplate } from '@/lib/automation/manage';
import {
  updateTemplateSchema,
  type UpdateTemplateBody,
} from '@/validations/automation.validation';
import { NextResponse } from 'next/server';

type RouteParams = { id: string; templateId: string };

export const PATCH = createParamHandle<RouteParams, UpdateTemplateBody>(
  {
    body: updateTemplateSchema,
    permission: 'template:manage',
    resolveProjectIds: ({ params }) => [parseId(params.id)],
  },
  async ({ params, body }) => {
    const updated = await changeTemplate(
      parseId(params.id),
      parseId(params.templateId),
      body,
    );
    return NextResponse.json({
      updated,
      message: 'Template saved',
      status: 200,
    });
  },
);

export const DELETE = createParamHandle<RouteParams>(
  {
    permission: 'template:manage',
    resolveProjectIds: ({ params }) => [parseId(params.id)],
  },
  async ({ params }) => {
    const deleted = await deleteTemplate(
      parseId(params.templateId),
      parseId(params.id),
    );
    if (!deleted) throw new NotFoundError('Template not found');
    return NextResponse.json({
      deleted,
      message: 'Template deleted',
      status: 200,
    });
  },
);
