import { authOptions } from "@/auth";
import { db } from "@/db";
import { membershipsTable, organizationsTable } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

type CreateOrganizationBody = {
  name?: string;
  description?: string | null;
};

const toOrganizationCache = (organization: {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  ...organization,
  timestamp: Date.now(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  const sessionUserId = session?.user?.id;

  if (!sessionUserId) {
    return NextResponse.json(
      {
        data: [],
        message: "Not authenticated",
        status: 401,
      },
      { status: 401 }
    );
  }

  try {
    const joinedOrganizations = await db
      .select({
        organization: organizationsTable,
      })
      .from(membershipsTable)
      .innerJoin(
        organizationsTable,
        eq(membershipsTable.organizationId, organizationsTable.id)
      )
      .where(eq(membershipsTable.userId, sessionUserId))
      .orderBy(desc(organizationsTable.createdAt));

    const organizations = joinedOrganizations.map((row) =>
      toOrganizationCache(row.organization)
    );

    return NextResponse.json(
      {
        data: organizations,
        message: "Get organizations success",
        status: 200,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to fetch organizations:", error);
    return NextResponse.json(
      {
        data: [],
        message: "Failed to fetch organizations",
        status: 500,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const sessionUserId = session?.user?.id;

  if (!sessionUserId) {
    return NextResponse.json(
      {
        created: null,
        message: "Not authenticated",
        status: 401,
      },
      { status: 401 }
    );
  }

  try {
    const body = (await request.json()) as CreateOrganizationBody;
    const name = body.name?.trim() ?? "";
    const description = body.description?.trim() || null;

    if (!name) {
      return NextResponse.json(
        {
          created: null,
          message: "Organization name is required",
          status: 400,
        },
        { status: 400 }
      );
    }

    const [ownerMembership] = await db
      .select({ id: membershipsTable.id })
      .from(membershipsTable)
      .where(
        and(
          eq(membershipsTable.userId, sessionUserId),
          eq(membershipsTable.role, "owner")
        )
      )
      .limit(1);

    if (ownerMembership) {
      return NextResponse.json(
        {
          created: null,
          message: "User already has owned organization",
          status: 400,
        },
        { status: 400 }
      );
    }

    const createdOrganization = await db.transaction(async (tx) => {
      const [organization] = await tx
        .insert(organizationsTable)
        .values({
          name,
          description,
          createdBy: sessionUserId,
        })
        .returning();

      await tx.insert(membershipsTable).values({
        userId: sessionUserId,
        organizationId: organization.id,
        role: "owner",
      });

      return organization;
    });

    return NextResponse.json(
      {
        created: toOrganizationCache(createdOrganization),
        message: "Create organization success",
        status: 201,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create organization:", error);
    return NextResponse.json(
      {
        created: null,
        message: "Failed to create organization",
        status: 500,
      },
      { status: 500 }
    );
  }
}
