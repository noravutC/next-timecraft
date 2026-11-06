// app/api/organization/[id]/route.ts: PATCH = name, logo and time zone

import {
  toOrganizationCache,
  updateOrganization,
} from '@/db/uniq-query/organization/organization-utils';
import { getOrgRole } from '@/db/uniq-query/project/project-utils';
import { ForbiddenError, NotFoundError } from '@/lib/api/errors';
import { createParamHandle } from '@/lib/api/handle';
import { parseId } from '@/lib/api/params';
import { canManageWorkspace } from '@/lib/rbac/workspace-permissions';
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
    if (!canManageWorkspace(await getOrgRole(userId, organizationId))) {
      throw new ForbiddenError(
        'Only the owner and admins can change workspace settings',
      );
    }
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
