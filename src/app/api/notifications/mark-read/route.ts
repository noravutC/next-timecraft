import { authOptions } from "@/auth";
import { db } from "@/db";
import { notificationsTable } from "@/db/schema";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const sessionUserId = session?.user?.id;
  if (!sessionUserId) {
    return NextResponse.json(
      { created: null, message: "Not authenticated", status: 401 },
      { status: 401 },
    );
  }

  let body: { ids?: string[]; all?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { created: null, message: "Invalid JSON", status: 400 },
      { status: 400 },
    );
  }

  try {
    if (body.all) {
      const result = await db
        .update(notificationsTable)
        .set({ readAt: new Date() })
        .where(
          and(
            eq(notificationsTable.userId, sessionUserId),
            isNull(notificationsTable.readAt),
          ),
        )
        .returning({ id: notificationsTable.id });

      return NextResponse.json(
        {
          created: { updated: result.length },
          message: "Marked all read",
          status: 200,
        },
        { status: 200 },
      );
    }

    const ids = Array.isArray(body.ids)
      ? body.ids.filter((i) => typeof i === "string")
      : [];
    if (ids.length === 0) {
      return NextResponse.json(
        { created: { updated: 0 }, message: "No ids provided", status: 200 },
        { status: 200 },
      );
    }

    const result = await db
      .update(notificationsTable)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notificationsTable.userId, sessionUserId),
          inArray(notificationsTable.id, ids),
          isNull(notificationsTable.readAt),
        ),
      )
      .returning({ id: notificationsTable.id });

    return NextResponse.json(
      {
        created: { updated: result.length },
        message: "Marked read",
        status: 200,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to mark notifications:", error);
    return NextResponse.json(
      { created: null, message: "Failed to mark notifications", status: 500 },
      { status: 500 },
    );
  }
}
