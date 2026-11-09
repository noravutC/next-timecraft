// app/api/project/[id]/route.ts

import { db } from "@/db";
import { projectsTable } from "@/db/schema";
import { renameBoardTags } from "@/db/uniq-query/task/tag-utils";
import { hasTagRenames } from "@/helper/utils/tag-rename";
import { BadRequestError } from "@/lib/api/errors";
import { createParamHandle } from "@/lib/api/handle";
import { parseId } from "@/lib/api/params";
import { triggerExclusive } from "@/lib/pusher-server";
import {
  broadcastBoardDeleted,
  broadcastBoardsChanged,
} from "@/lib/realtime/board-events";
import { projectSettingsSchema } from "@/types/project-settings";
import {
  isValidProjectCoverImage,
  normalizeCoverImage,
  updateProjectSchema,
  type UpdateProjectBody,
} from "@/validations/project.validation";
import { eq, sql } from "drizzle-orm";
import type { PgUpdateSetSource } from "drizzle-orm/pg-core";
import { NextResponse } from "next/server";

type RouteParams = { id: string };

export const PATCH = createParamHandle<RouteParams, UpdateProjectBody>(
  {
    body: updateProjectSchema,
    permission: "project:update",
    resolveProjectIds: ({ params }) => [parseId(params.id)],
  },
  async ({ request, params, body, userId }) => {
    const projectId = parseId(params.id);

    const name = body.name?.trim();
    if (name !== undefined && name.length === 0) {
      throw new BadRequestError("Project name cannot be empty");
    }

    const coverImage =
      body.coverImage !== undefined
        ? normalizeCoverImage(body.coverImage)
        : undefined;

    if (coverImage && !isValidProjectCoverImage(coverImage)) {
      throw new BadRequestError("Project cover image is invalid");
    }

    const settingsResult =
      body.settings !== undefined
        ? projectSettingsSchema.safeParse(body.settings)
        : undefined;

    if (settingsResult && !settingsResult.success) {
      throw new BadRequestError(
        `Invalid project settings: ${
          settingsResult.error.issues[0]?.message ?? "validation failed"
        }`,
      );
    }

    const updatePayload: PgUpdateSetSource<typeof projectsTable> = {
      updatedAt: new Date(),
    };
    if (name !== undefined) updatePayload.name = name;
    if (body.description !== undefined)
      updatePayload.description = body.description.trim() || null;
    if (coverImage !== undefined) updatePayload.coverImage = coverImage;
    if (Array.isArray(body.tags)) updatePayload.tags = body.tags;
    if (typeof body.archived === "boolean") {
      updatePayload.archived = body.archived;
      // first archiving keeps its date and person; restoring clears them
      updatePayload.archivedAt = body.archived
        ? sql`coalesce(${projectsTable.archivedAt}, now())`
        : null;
      updatePayload.archivedBy = body.archived
        ? sql`coalesce(${projectsTable.archivedBy}, ${userId}::uuid)`
        : null;
    }
    if (settingsResult?.success)
      updatePayload.settings = settingsResult.data;

    const renames = body.renameTags ?? {};
    if (hasTagRenames(renames)) {
      const tags = body.tags ?? [];
      if (!Object.values(renames).every((tag) => tags.includes(tag))) {
        throw new BadRequestError("Renamed tags must be in the tag list");
      }
    }

    const { updated, retagged } = await db.transaction(async (tx) => {
      const [row] = await tx
        .update(projectsTable)
        .set(updatePayload)
        .where(eq(projectsTable.id, projectId))
        .returning();
      return {
        updated: row,
        retagged: await renameBoardTags(tx, projectId, renames),
      };
    });

    broadcastBoardsChanged(request, [projectId]);
    if (retagged > 0) {
      triggerExclusive(request, `project-${projectId}`, "tags-renamed", {
        renames,
      }).catch((e) => console.error("Pusher tags-renamed failed:", e));
    }

    return NextResponse.json(
      { updated, message: "Project updated successfully", status: 200 },
      { status: 200 },
    );
  },
);

export const DELETE = createParamHandle<RouteParams>(
  {
    permission: "project:delete",
    resolveProjectIds: ({ params }) => [parseId(params.id)],
  },
  async ({ request, params }) => {
    const projectId = parseId(params.id);

    const [deleted] = await db
      .delete(projectsTable)
      .where(eq(projectsTable.id, projectId))
      .returning();
    if (deleted) broadcastBoardDeleted(request, projectId);

    return NextResponse.json(
      { deleted, message: "Project deleted successfully", status: 200 },
      { status: 200 },
    );
  },
);
