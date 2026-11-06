// app/api/project/[id]/transfer/route.ts: POST = hand the board to another member

import { transferProjectOwnership } from '@/db/uniq-query/project/project-utils';
import { BadRequestError } from '@/lib/api/errors';
import { createParamHandle } from '@/lib/api/handle';
import { parseId } from '@/lib/api/params';
import {
  transferOwnershipSchema,
  type TransferOwnershipBody,
} from '@/validations/project.validation';
import { NextResponse } from 'next/server';

type RouteParams = { id: string };

export const POST = createParamHandle<RouteParams, TransferOwnershipBody>(
  {
    body: transferOwnershipSchema,
    permission: 'project:transfer_ownership',
    resolveProjectIds: ({ params }) => [parseId(params.id)],
  },
  async ({ params, body, userId }) => {
    const projectId = parseId(params.id);
    if (body.userId === userId) {
      throw new BadRequestError('You already own this board');
    }
    if (!(await transferProjectOwnership(projectId, userId, body.userId))) {
      throw new BadRequestError('The new owner has to be on the board');
    }
    return NextResponse.json(
      {
        updated: { projectId, ownerId: body.userId },
        message: 'Ownership transferred',
        status: 200,
      },
      { status: 200 },
    );
  },
);
