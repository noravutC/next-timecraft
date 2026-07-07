import {
  filterVisibleUserIds,
  getPublicUsersByIds,
} from "@/db/uniq-query/user/user-utils";
import { createHandle } from "@/lib/api/handle";
import {
  lookUpUsersSchema,
  type LookUpUsersBody,
} from "@/validations/user.validation";
import { NextResponse } from "next/server";

export const POST = createHandle<LookUpUsersBody>(
  { body: lookUpUsersSchema },
  async ({ userId, body }) => {
    const visibleIds = await filterVisibleUserIds(userId, body.userIds);
    const users = await getPublicUsersByIds(visibleIds);

    return NextResponse.json(
      { data: users, message: "Users fetched", status: 200 },
      { status: 200 },
    );
  },
);
