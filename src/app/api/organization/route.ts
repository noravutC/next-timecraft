
// app/api/organization/route.ts

import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { OrganizationsModel } from "@/model/group-user/organization";
import { MembershipModel } from "@/model/group-user/member-ship";
import { type Organizations} from "@/types";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import {
  OrganizationSchema,
  MembershipType, 
  MembershipSchema
} from "@/model/validate";

export async function GET() {
  const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Not  authenticated",
          data: [],
        },
        { status: 401 }
      );
    }
  try {
    await connectDB();

    const response: Organizations[] = await OrganizationsModel.find();
    return NextResponse.json(
      {
        success: true,
        message: "Success",
        data: response,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error fetching organizations:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch organizations",
        data: [],
        error: error,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(
      {
        success: false,
        message: "Not  authenticated",
        data: [],
      },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const normalized = OrganizationSchema.parse(body);
    await connectDB();
    const organizationData = new OrganizationsModel(normalized);
    await organizationData.save();

    const currentOrg = (organizationData as  Organizations) ?? null
    const normalizedMemberShip:MembershipType = {
      userId: currentOrg.createdBy,
      role: "owner",
      organizationId: currentOrg._id,
    }
    const memberShipData = new MembershipModel(normalizedMemberShip)
    await memberShipData.save();
    return NextResponse.json(
      {
        success: true,
        message: "Create organization success",
        created: currentOrg,
      },
      { status: 201 }
    );
  } catch (error) {
    console.log("Error create organization:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create organization",
        data: [],
        error: error,
      },
      { status: 500 }
    );
  }
}
