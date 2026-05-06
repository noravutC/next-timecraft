import { authOptions } from "@/auth";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { created: null, message: "Not authenticated", status: 401 },
      { status: 401 },
    );
  }

  return NextResponse.json(
    {
      created: null,
      message:
        "Self-join is disabled. Membership requires invitation by an org owner/admin.",
      status: 403,
    },
    { status: 403 },
  );
}
