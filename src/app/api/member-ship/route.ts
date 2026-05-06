import { ForbiddenError } from "@/lib/api/errors";
import { createHandle } from "@/lib/api/handle";

export const POST = createHandle(
  {},
  async () => {
    throw new ForbiddenError(
      "Self-join is disabled. Membership requires invitation by an org owner/admin.",
    );
  },
);
