// app/api/project/route.ts — POST: mode "create" | "fetch"

import {
  createProjectWithOwner,
  fetchProjectsWithMembers,
  getOrgRole,
} from "@/db/uniq-query/project/project-utils";
import {
  BadRequestError,
  ForbiddenError,
  UnauthorizedError,
} from "@/lib/api/errors";
import { createHandle } from "@/lib/api/handle";
import {
  isValidProjectCoverImage,
  normalizeCoverImage,
  projectRequestSchema,
  type ProjectRequestBody,
} from "@/validations/project.validation";
import { NextResponse } from "next/server";

export const POST = createHandle<ProjectRequestBody>(
  { body: projectRequestSchema },
  async ({ body, userId, session }) => {
    if ("mode" in body && body.mode === "create") {
      // สร้างบอร์ดต้องมี org (บอร์ดสังกัด org) — แต่ fetch ไม่ต้อง:
      // สมาชิกข้ามองค์กร/ยังไม่มี org ต้องเห็นบอร์ดที่ตัวเองถูกเชิญ
      const organizationId = session.user?.organizationId;
      if (!organizationId?.trim()) {
        throw new UnauthorizedError("Not authenticated");
      }

      const projectName = body.project?.name?.trim() ?? "";
      if (!projectName) {
        throw new BadRequestError("Project name is required");
      }
      const coverImage = normalizeCoverImage(body.project?.coverImage);
      if (coverImage && !isValidProjectCoverImage(coverImage)) {
        throw new BadRequestError("Project cover image is invalid");
      }

      const orgRole = await getOrgRole(userId, organizationId);
      if (orgRole !== "owner" && orgRole !== "admin") {
        throw new ForbiddenError(
          "Forbidden — only org owner/admin can create projects",
        );
      }

      const createdProject = await createProjectWithOwner({
        organizationId,
        ownerId: userId,
        name: projectName,
        description: body.project?.description?.trim() || null,
        coverImage,
        archived: Boolean(body.project?.archived),
        tags: body.project?.tags ?? [],
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

    const projects = await fetchProjectsWithMembers(
      userId,
      fetchAll ? [] : projectIds,
    );
    const data = projects.map((project) => ({
      ...project,
      timestamp: Date.now(),
    }));

    return NextResponse.json(
      { data, message: "Get projects success", status: 200 },
      { status: 200 },
    );
  },
);
