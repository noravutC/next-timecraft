// app/api/project/[id]/members/route.ts

import { db } from '@/db';
import { projectMembersTable, usersTable } from '@/db/schema';
import { BadRequestError, NotFoundError } from '@/lib/api/errors';
import { createParamHandle } from '@/lib/api/handle';
import type { Member } from '@/types';
import { and, eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

type RouteParams = { id: string };

const inviteMemberSchema = z.object({
  email: z.email().max(255),
  role: z.enum(['admin', 'editor', 'viewer']),
});

type InviteMemberBody = z.infer<typeof inviteMemberSchema>;

export const POST = createParamHandle<RouteParams, InviteMemberBody>(
  {
    body: inviteMemberSchema,
    permission: 'member:invite',
    resolveProjectIds: ({ params }) => [params.id],
  },
  async ({ params, body }) => {
    const projectId = params.id;
    const email = body.email.trim().toLowerCase();

    const [invitee] = await db
      .select()
      .from(usersTable)
      .where(sql`lower(${usersTable.email}) = ${email}`)
      .limit(1);

    if (!invitee) {
      throw new NotFoundError('No TimeCraft account found for this email');
    }

    const [existing] = await db
      .select({ id: projectMembersTable.id })
      .from(projectMembersTable)
      .where(
        and(
          eq(projectMembersTable.projectId, projectId),
          eq(projectMembersTable.userId, invitee.id),
        ),
      )
      .limit(1);

    if (existing) {
      throw new BadRequestError('This user is already a member of the board');
    }

    const [inserted] = await db
      .insert(projectMembersTable)
      .values({ projectId, userId: invitee.id, role: body.role })
      .returning();

    const created: Member = {
      userId: inserted.userId,
      role: inserted.role,
      joinedAt: inserted.joinedAt,
    };

    return NextResponse.json(
      { created, message: 'Member invited successfully', status: 201 },
      { status: 201 },
    );
  },
);
