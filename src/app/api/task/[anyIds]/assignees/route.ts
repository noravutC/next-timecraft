import { db } from "@/db";
import { projectMembersTable } from "@/db/schema";
import { NotFoundError } from "@/lib/api/errors";
import { createParamHandle } from "@/lib/api/handle";
import {
  fetchAssignees,
  getTaskColumnLink,
  setAssignees,
} from "@/db/uniq-query/task/assignee-utils";
import { triggerExclusive } from "@/lib/pusher-server";
import { authorizeOrThrow } from "@/lib/rbac/authorize";
import { and, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

type RouteParams = { anyIds: string };

export const GET = createParamHandle<RouteParams>(
  {},
  async ({ params, userId }) => {
    const taskId = params.anyIds;
    const link = await getTaskColumnLink(taskId);
    if (!link) throw new NotFoundError("Task not found");

    await authorizeOrThrow(userId, [link.projectId], "project:view");

    const data = await fetchAssignees(taskId);
    return NextResponse.json(
      { data, message: "Fetch assignees success", status: 200 },
      { status: 200 },
    );
  },
);

const updateAssigneesSchema = z.object({
  userIds: z.array(z.string()).default([]),
});

type UpdateAssigneesBody = z.infer<typeof updateAssigneesSchema>;

export const PATCH = createParamHandle<RouteParams, UpdateAssigneesBody>(
  { body: updateAssigneesSchema },
  async ({ request, params, body, userId }) => {
    const taskId = params.anyIds;
    const requested = [...new Set(body.userIds)];

    const link = await getTaskColumnLink(taskId);
    if (!link) throw new NotFoundError("Task not found");

    await authorizeOrThrow(userId, [link.projectId], "task:update");

    let validUserIds: string[] = [];
    if (requested.length > 0) {
      const members = await db
        .select({ userId: projectMembersTable.userId })
        .from(projectMembersTable)
        .where(
          and(
            eq(projectMembersTable.projectId, link.projectId),
            inArray(projectMembersTable.userId, requested),
          ),
        );
      validUserIds = members.map((m) => m.userId);
    }

    const updated = await setAssignees(taskId, validUserIds);
    triggerExclusive(
      request,
      `project-${link.projectId}`,
      "task-assignees-updated",
      { taskId, assignees: updated },
    ).catch((e) => console.error("Pusher assignees failed:", e));

    return NextResponse.json(
      { updated, message: "Update assignees success", status: 200 },
      { status: 200 },
    );
  },
);
