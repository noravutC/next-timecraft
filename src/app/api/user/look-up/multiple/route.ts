import { authOptions } from "@/auth";
import { db } from "@/db";
import { usersTable } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { data: [], message: "Not authenticated", status: 401 },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const userIds: string[] = Array.isArray(body?.userIds) ? body.userIds : [];

    if (userIds.length === 0) {
      return NextResponse.json(
        { data: [], message: "No user IDs provided", status: 400 },
        { status: 400 },
      );
    }

    const users = await db
      .select({
        id: usersTable.id,
        fullName: usersTable.fullName,
        email: usersTable.email,
        avatar: usersTable.avatar,
      })
      .from(usersTable)
      .where(inArray(usersTable.id, userIds));

    return NextResponse.json(
      { data: users, message: "Users fetched", status: 200 },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching users by ids:", error);
    return NextResponse.json(
      { data: [], message: "Failed to fetch users", status: 500 },
      { status: 500 },
    );
  }
}
