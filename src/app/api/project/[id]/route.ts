// app/api/project/[id]/route.ts

import { db } from "@/db";
import { projectsTable } from "@/db/schema";
import { BadRequestError } from "@/lib/api/errors";
import { createParamHandle } from "@/lib/api/handle";
import { projectSettingsSchema } from "@/types/project-settings";
import {
  isValidProjectCoverImage,
  normalizeCoverImage,
  updateProjectSchema,
  type UpdateProjectBody,
} from "@/validations/project.validation";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

type RouteParams = { id: string };

export const PATCH = createParamHandle<RouteParams, UpdateProjectBody>(
  {
    body: updateProjectSchema,
    permission: "project:update",
    resolveProjectIds: ({ params }) => [params.id],
  },
  async ({ params, body }) => {
    const projectId = params.id;
    if (!projectId?.trim()) {
      throw new BadRequestError("Project ID is required");
    }

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

    const updatePayload: Partial<typeof projectsTable.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (name !== undefined) updatePayload.name = name;
    if (body.description !== undefined)
      updatePayload.description = body.description.trim() || null;
    if (coverImage !== undefined) updatePayload.coverImage = coverImage;
    if (Array.isArray(body.tags)) updatePayload.tags = body.tags;
    if (typeof body.archived === "boolean")
      updatePayload.archived = body.archived;
    if (settingsResult?.success)
      updatePayload.settings = settingsResult.data;

    const [updated] = await db
      .update(projectsTable)
      .set(updatePayload)
      .where(eq(projectsTable.id, projectId))
      .returning();

    return NextResponse.json(
      { updated, message: "Project updated successfully", status: 200 },
      { status: 200 },
    );
  },
);

export const DELETE = createParamHandle<RouteParams>(
  {
    permission: "project:delete",
    resolveProjectIds: ({ params }) => [params.id],
  },
  async ({ params }) => {
    const projectId = params.id;
    if (!projectId?.trim()) {
      throw new BadRequestError("Project ID is required");
    }

    const [deleted] = await db
      .delete(projectsTable)
      .where(eq(projectsTable.id, projectId))
      .returning();

    return NextResponse.json(
      { deleted, message: "Project deleted successfully", status: 200 },
      { status: 200 },
    );
  },
);
