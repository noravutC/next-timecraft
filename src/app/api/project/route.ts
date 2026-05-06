// app/api/project/route.ts

import { db } from "@/db";
import {
  membershipsTable,
  projectMembersTable,
  projectsTable,
} from "@/db/schema";
import {
  BadRequestError,
  ForbiddenError,
  UnauthorizedError,
} from "@/lib/api/errors";
import { createHandle } from "@/lib/api/handle";
import { and, desc, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

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

const projectRequestSchema = z.union([
  z.object({
    mode: z.literal("create"),
    project: z
      .object({
        name: z.string().optional(),
        description: z.string().optional(),
        coverImage: z.string().nullable().optional(),
        archived: z.boolean().optional(),
        tags: z.array(z.string()).optional(),
      })
      .optional(),
  }),
  z.object({
    mode: z.literal("fetch").optional(),
    fetchAll: z.boolean().optional(),
    projectIds: z.union([z.string(), z.array(z.string())]).optional(),
  }),
]);

type ProjectRequestBody = z.infer<typeof projectRequestSchema>;

export const POST = createHandle<ProjectRequestBody>(
  { body: projectRequestSchema },
  async ({ body, userId, session }) => {
    const organizationId = session.user?.organizationId;
    if (!organizationId?.trim()) {
      throw new UnauthorizedError("Not authenticated");
    }

    if ("mode" in body && body.mode === "create") {
      const projectName = body.project?.name?.trim() ?? "";
      const coverImage = normalizeCoverImage(body.project?.coverImage);
      if (!projectName) {
        throw new BadRequestError("Project name is required");
      }
      if (coverImage && !isValidProjectCoverImage(coverImage)) {
        throw new BadRequestError("Project cover image is invalid");
      }

      const [orgMembership] = await db
        .select({ role: membershipsTable.role })
        .from(membershipsTable)
        .where(
          and(
            eq(membershipsTable.userId, userId),
            eq(membershipsTable.organizationId, organizationId),
          ),
        )
        .limit(1);
      if (
        !orgMembership ||
        (orgMembership.role !== "owner" && orgMembership.role !== "admin")
      ) {
        throw new ForbiddenError(
          "Forbidden — only org owner/admin can create projects",
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

    const fetchAll =
      "fetchAll" in body && typeof body.fetchAll === "boolean"
        ? body.fetchAll
        : false;
    const rawProjectIds = "projectIds" in body ? body.projectIds : undefined;
    const projectIds =
      typeof rawProjectIds === "string"
        ? rawProjectIds.split(",").map((id) => id.trim()).filter(Boolean)
        : Array.isArray(rawProjectIds)
          ? rawProjectIds.map((id) => id.trim()).filter(Boolean)
          : [];

    const myMemberRows = await db
      .select({ projectId: projectMembersTable.projectId })
      .from(projectMembersTable)
      .where(eq(projectMembersTable.userId, userId));
    const memberProjectIds = myMemberRows.map((r) => r.projectId);
    if (memberProjectIds.length === 0) {
      return NextResponse.json(
        { data: [], message: "Get projects success", status: 200 },
        { status: 200 },
      );
    }

    const projects =
      fetchAll || projectIds.length === 0
        ? await db
            .select()
            .from(projectsTable)
            .where(
              and(
                eq(projectsTable.organizationId, organizationId),
                inArray(projectsTable.id, memberProjectIds),
              ),
            )
            .orderBy(desc(projectsTable.createdAt))
        : await db
            .select()
            .from(projectsTable)
            .where(
              and(
                inArray(projectsTable.id, projectIds),
                eq(projectsTable.organizationId, organizationId),
                inArray(projectsTable.id, memberProjectIds),
              ),
            )
            .orderBy(desc(projectsTable.createdAt));

    const allProjectIds = projects.map((p) => p.id);
    const memberRows =
      allProjectIds.length > 0
        ? await db
            .select({
              projectId: projectMembersTable.projectId,
              userId: projectMembersTable.userId,
              role: projectMembersTable.role,
              joinedAt: projectMembersTable.joinedAt,
            })
            .from(projectMembersTable)
            .where(inArray(projectMembersTable.projectId, allProjectIds))
        : [];

    const membersByProject = memberRows.reduce<
      Record<string, typeof memberRows>
    >((acc, m) => {
      (acc[m.projectId] ??= []).push(m);
      return acc;
    }, {});

    const data = projects.map((project) => ({
      ...project,
      members: membersByProject[project.id] ?? [],
      timestamp: Date.now(),
    }));

    return NextResponse.json(
      { data, message: "Get projects success", status: 200 },
      { status: 200 },
    );
  },
);
