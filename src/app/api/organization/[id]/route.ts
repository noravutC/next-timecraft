// app/api/organization/[id]/route.ts: PATCH = name, logo and time zone

import {
  toOrganizationCache,
  updateOrganization,
} from '@/db/uniq-query/organization/organization-utils';
import { NotFoundError } from '@/lib/api/errors';
import { createParamHandle } from '@/lib/api/handle';
import { parseId } from '@/lib/api/params';
import { authorizeWorkspace } from '@/lib/rbac/authorize-workspace';
import {
  updateOrganizationSchema,
  type UpdateOrganizationBody,
} from '@/validations/organization.validation';
import { NextResponse } from 'next/server';

type RouteParams = { id: string };

export const PATCH = createParamHandle<RouteParams, UpdateOrganizationBody>(
  { body: updateOrganizationSchema },
  async ({ params, body, userId }) => {
    const organizationId = parseId(params.id);
    await authorizeWorkspace(userId, organizationId, 'manage');
    const updated = await updateOrganization(organizationId, body);
    if (!updated) throw new NotFoundError('Workspace not found');

    return NextResponse.json(
      {
        updated: toOrganizationCache(updated),
        message: 'Workspace updated',
        status: 200,
      },
      { status: 200 },
    );
  },
);
