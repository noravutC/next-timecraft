import {
  createOwnedOrganization,
  getUserOrganizations,
  toOrganizationCache,
} from '@/db/uniq-query/organization/organization-utils';
import { BadRequestError } from '@/lib/api/errors';
import { createHandle } from '@/lib/api/handle';
import {
  createOrganizationSchema,
  type CreateOrganizationBody,
} from '@/validations/organization.validation';
import { NextResponse } from 'next/server';

export const GET = createHandle({}, async ({ userId }) => {
  const organizations = await getUserOrganizations(userId);
  return NextResponse.json(
    { data: organizations, message: 'Get organizations success', status: 200 },
    { status: 200 },
  );
});

// one owned org per user, enforced from the DB (never from session flags)
export const POST = createHandle<CreateOrganizationBody>(
  { body: createOrganizationSchema },
  async ({ userId, body }) => {
    const created = await createOwnedOrganization(userId, {
      name: body.name,
      description: body.description || null,
      logo: body.logo ?? null,
      timeZone: body.timeZone,
    });
    if (!created) {
      throw new BadRequestError('User already has owned organization');
    }

    return NextResponse.json(
      {
        created: toOrganizationCache(created),
        message: 'Create organization success',
        status: 201,
      },
      { status: 201 },
    );
  },
);
