import { authOptions } from "@/auth";
import { db } from "@/db";
import { columnsTable, projectMembersTable, tasksTable } from "@/db/schema";
import { hasPermission } from "@/db/uniq-query/project/project-utils";
// import { UpdateColumnPayload } from "@/types";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

// type RouteParams = {
//   anyIds: string;
// };

// type UpdateColumnBody = Array<UpdateColumnPayload>;

export async function GET(
  request: Request,
  // { params }: { params: Promise<RouteParams> },
) {
  const session = await getServerSession(authOptions);
  const sessionUserId = session?.user?.id;

  if (!sessionUserId) {
    return NextResponse.json(
      {
        data: [],
        message: "Not authenticated",
        status: 401,
      },
      { status: 401 },
    );
  }

  // const { anyIds } = await params;
  // const projectIds = anyIds
  //   .trim()
  //   .split(",")
  //   .filter((id) => id);
  // if (projectIds.length === 0) {
  //   return NextResponse.json(
  //     {
  //       data: [],
  //       message: "projectId is required",
  //       status: 400,
  //     },
  //     { status: 400 },
  //   );
  // }

  // const permission = await hasPermission(
  //   sessionUserId,
  //   projectIds,
  //   "project:view",
  // );
  // if (!permission) {
  //   return NextResponse.json(
  //     {
  //       created: null,
  //       message: "Forbidden",
  //       status: 403,
  //     },
  //     { status: 403 },
  //   );
  // }

  // Keep compatibility with existing client query string (`?limit=...`).
  // This route returns all columns; limit is currently unused.
  // void new URL(request.url).searchParams.get("limit");

  try {
    // const columns = await db
    //   .select()
    //   .from(columnsTable)
    //   .innerJoin(
    //     projectMembersTable,
    //     eq(projectMembersTable.projectId, columnsTable.projectId),
    //   )
    //   .where(
    //     and(
    //       inArray(columnsTable.projectId, projectIds),
    //       eq(projectMembersTable.userId, sessionUserId),
    //       eq(columnsTable.isDeleted, false),
    //     ),
    //   )
    //   .orderBy(asc(columnsTable.projectId), asc(columnsTable.orderFraction));

    return NextResponse.json(
      {
        data: [],
        message: "Get columns success",
        status: 200,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to fetch columns:", error);
    return NextResponse.json(
      {
        data: [],
        message: "Failed to fetch columns",
        status: 500,
      },
      { status: 500 },
    );
  }
}
