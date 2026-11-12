import {
  getDigestState,
  setDigest,
} from '@/db/uniq-query/project/digest-utils';
import { ForbiddenError } from '@/lib/api/errors';
import { createParamHandle } from '@/lib/api/handle';
import { parseId } from '@/lib/api/params';
import { isGuestSession } from '@/lib/guest';
import {
  setDigestSchema,
  type SetDigestBody,
} from '@/validations/project.validation';
import { NextResponse } from 'next/server';

type RouteParams = { id: string };

/** Whether you get this board's weekly digest, and when the next one is. */
export const GET = createParamHandle<RouteParams>(
  {
    permission: 'project:view',
    resolveProjectIds: ({ params }) => [parseId(params.id)],
  },
  async ({ params, userId }) => {
    const data = await getDigestState(userId, parseId(params.id));
    return NextResponse.json({ data, message: 'Weekly digest', status: 200 });
  },
);

/** Turns your weekly digest for this board on or off. */
export const PUT = createParamHandle<RouteParams, SetDigestBody>(
  {
    body: setDigestSchema,
    permission: 'project:view',
    resolveProjectIds: ({ params }) => [parseId(params.id)],
  },
  async ({ params, body, userId, session }) => {
    // everyone in the demo shares one account, and it has no inbox
    if (isGuestSession(session)) {
      throw new ForbiddenError('Sign in with Google to get the weekly digest');
    }
    const projectId = parseId(params.id);
    await setDigest(userId, projectId, body.on);
    const updated = await getDigestState(userId, projectId);
    return NextResponse.json({
      updated,
      message: body.on ? 'Weekly digest on' : 'Weekly digest off',
      status: 200,
    });
  },
);
