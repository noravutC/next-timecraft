import { authOptions } from "@/auth";
import {
  countUnreadNotifications,
  fetchNotificationsPage,
} from "@/db/uniq-query/notification/notification-utils";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const sessionUserId = session?.user?.id;
  if (!sessionUserId) {
    return NextResponse.json(
      { data: null, message: "Not authenticated", status: 401 },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");
  const unreadOnly = url.searchParams.get("unreadOnly") === "1";
  const rawLimit = Number(url.searchParams.get("limit") ?? DEFAULT_LIMIT);
  const limit = Math.min(
    Math.max(Number.isFinite(rawLimit) ? rawLimit : DEFAULT_LIMIT, 1),
    MAX_LIMIT,
  );

  try {
    const [page, unreadCount] = await Promise.all([
      fetchNotificationsPage({
        userId: sessionUserId,
        cursor,
        limit,
        unreadOnly,
      }),
      countUnreadNotifications(sessionUserId),
    ]);

    return NextResponse.json(
      {
        data: { ...page, unreadCount },
        message: "Fetch notifications success",
        status: 200,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return NextResponse.json(
      { data: null, message: "Failed to fetch notifications", status: 500 },
      { status: 500 },
    );
  }
}
