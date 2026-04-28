// app/api/project/[id]/route.ts

import { authOptions } from "@/auth";
import { db } from "@/db";
import { projectMembersTable, projectsTable } from "@/db/schema";
import { hasPermission } from "@/db/uniq-query/project/project-utils";
import { projectSettingsSchema } from "@/types/project-settings";
import { and, eq } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

const DATA_URL_IMAGE_PATTERN =
  /^data:image\/[a-zA-Z0-9.+-]+;base64,[a-zA-Z0-9+/=\s]+$/;
const HTTP_URL_PATTERN = /^https?:\/\/\S+$/i;
const MAX_PROJECT_COVER_IMAGE_LENGTH = 2_900_000;

const normalizeCoverImage = (value?: string | null) => {
  const normalized = value?.trim() ?? "";
  return normalized.length > 0 ? normalized : null;
};

const isValidProjectCoverImage = (value: string) => {
  if (value.length > MAX_PROJECT_COVER_IMAGE_LENGTH) return false;
  return DATA_URL_IMAGE_PATTERN.test(value) || HTTP_URL_PATTERN.test(value);
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId?.trim()) {
    return NextResponse.json(
      { updated: null, message: "Not authenticated", status: 401 },
      { status: 401 },
    );
  }

  const { id: projectId } = await params;

  if (!projectId?.trim()) {
    return NextResponse.json(
      { updated: null, message: "Project ID is required", status: 400 },
      { status: 400 },
    );
  }

  const canUpdate = await hasPermission(userId, [projectId], "project:update");
  if (!canUpdate) {
    return NextResponse.json(
      { updated: null, message: "Forbidden", status: 403 },
      { status: 403 },
    );
  }

  try {
    const body = (await request.json()) as {
      name?: string;
      description?: string;
      coverImage?: string | null;
      tags?: string[];
      archived?: boolean;
      settings?: unknown;
    };

    const name = body.name?.trim();
    if (name !== undefined && name.length === 0) {
      return NextResponse.json(
        { updated: null, message: "Project name cannot be empty", status: 400 },
        { status: 400 },
      );
    }

    const coverImage =
      body.coverImage !== undefined
        ? normalizeCoverImage(body.coverImage)
        : undefined;

    if (coverImage && !isValidProjectCoverImage(coverImage)) {
      return NextResponse.json(
        { updated: null, message: "Project cover image is invalid", status: 400 },
        { status: 400 },
      );
    }

    const settingsResult =
      body.settings !== undefined
        ? projectSettingsSchema.safeParse(body.settings)
        : undefined;

    if (settingsResult && !settingsResult.success) {
      return NextResponse.json(
        {
          updated: null,
          message: `Invalid project settings: ${settingsResult.error.issues[0]?.message ?? "validation failed"}`,
          status: 400,
        },
        { status: 400 },
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
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { updated: null, message: "Failed to update project", status: 500 },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId?.trim()) {
    return NextResponse.json(
      { deleted: null, message: "Not authenticated", status: 401 },
      { status: 401 },
    );
  }

  const { id: projectId } = await params;

  if (!projectId?.trim()) {
    return NextResponse.json(
      { deleted: null, message: "Project ID is required", status: 400 },
      { status: 400 },
    );
  }

  const canDelete = await hasPermission(userId, [projectId], "project:delete");
  if (!canDelete) {
    return NextResponse.json(
      { deleted: null, message: "Forbidden — only owner can delete", status: 403 },
      { status: 403 },
    );
  }

  try {
    const [deleted] = await db
      .delete(projectsTable)
      .where(eq(projectsTable.id, projectId))
      .returning();

    return NextResponse.json(
      { deleted, message: "Project deleted successfully", status: 200 },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { deleted: null, message: "Failed to delete project", status: 500 },
      { status: 500 },
    );
  }
}
