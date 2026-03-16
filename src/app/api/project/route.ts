// app/api/project/route.ts

import { db } from "@/db";
import { projectMembersTable, projectsTable } from "@/db/schema";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { and, desc, eq, inArray } from "drizzle-orm";

type FetchProjectsRequestBody = {
  mode?: "fetch";
  fetchAll?: boolean;
  projectIds?: string | string[];
};

type CreateProjectRequestBody = {
  mode: "create";
  project?: {
    name?: string;
    description?: string;
    coverImage?: string | null;
    archived?: boolean;
    tags?: string[];
  };
};

type ProjectRequestBody = FetchProjectsRequestBody | CreateProjectRequestBody;

const DATA_URL_IMAGE_PATTERN =
  /^data:image\/[a-zA-Z0-9.+-]+;base64,[a-zA-Z0-9+/=\s]+$/;
const HTTP_URL_PATTERN = /^https?:\/\/\S+$/i;
const MAX_PROJECT_COVER_IMAGE_LENGTH = 2_900_000;

const normalizeCoverImage = (value?: string | null) => {
  const normalized = value?.trim() ?? "";
  return normalized.length > 0 ? normalized : null;
};

const isValidProjectCoverImage = (value: string) => {
  if (value.length > MAX_PROJECT_COVER_IMAGE_LENGTH) {
    return false;
  }

  return DATA_URL_IMAGE_PATTERN.test(value) || HTTP_URL_PATTERN.test(value);
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const { id: userId, organizationId } = session?.user || {};
  if (!userId?.trim() || !organizationId?.trim()) {
    return NextResponse.json(
      {
        success: false,
        message: "Not  authenticated",
        data: [],
      },
      { status: 401 },
    );
  }

  try {
    const body = (await request.json()) as ProjectRequestBody;

    if (body.mode === "create") {
      const projectName = body.project?.name?.trim() ?? "";
      const coverImage = normalizeCoverImage(body.project?.coverImage);
      if (!projectName) {
        return NextResponse.json(
          {
            created: null,
            message: "Project name is required",
            status: 400,
          },
          { status: 400 },
        );
      }

      if (coverImage && !isValidProjectCoverImage(coverImage)) {
        return NextResponse.json(
          {
            created: null,
            message: "Project cover image is invalid",
            status: 400,
          },
          { status: 400 },
        );
      }

      const createdProject = await db.transaction(async (tx) => {
        const [project] = await tx
          .insert(projectsTable)
          .values({
            organizationId,
            ownerId: userId,
            name: projectName,
            description: body.project?.description?.trim() || null,
            coverImage,
            archived: Boolean(body.project?.archived),
            tags: body.project?.tags ?? [],
          })
          .returning();

        await tx.insert(projectMembersTable).values({
          projectId: project.id,
          userId,
          role: "owner",
          joinedAt: new Date(),
        });

        return project;
      });

      return NextResponse.json(
        {
          created: {
            ...createdProject,
            members: [{ userId, role: "owner", joinedAt: new Date() }],
            timestamp: Date.now(),
          },
          message: "Create project success",
          status: 201,
        },
        { status: 201 },
      );
    }

    const fetchAll = typeof body.fetchAll === "boolean" ? body.fetchAll : false;
    const projectIds =
      typeof body.projectIds === "string"
        ? body.projectIds
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean)
        : Array.isArray(body.projectIds)
          ? body.projectIds.map((id) => id.trim()).filter(Boolean)
          : [];

    const projects =
      fetchAll || projectIds.length === 0
        ? await db
            .select()
            .from(projectsTable)
            .where(eq(projectsTable.organizationId, organizationId))
            .orderBy(desc(projectsTable.createdAt))
        : await db
            .select()
            .from(projectsTable)
            .where(
              and(
                inArray(projectsTable.id, projectIds),
                eq(projectsTable.organizationId, organizationId),
              ),
            )
            .orderBy(desc(projectsTable.createdAt));

    const data = projects.map((project) => ({
      ...project,
      id: project.id,
      members: [],
      timestamp: Date.now(),
    }));

    return NextResponse.json(
      {
        data,
        message: "Get projects success",
        status: 200,
      },
      { status: 200 },
    );
  } catch (error) {
    console.log("Error get projects from body:", error);
    return NextResponse.json(
      {
        message: "Failed to get projects",
        status: 500,
        data: [],
        error: error,
      },
      { status: 500 },
    );
  }
}
