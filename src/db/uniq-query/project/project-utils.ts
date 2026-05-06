import { authorize } from "@/lib/rbac/authorize";
import { Permission } from "@/lib/rbac/permissions";

/**
 * @deprecated Import `authorize` from "@/lib/rbac/authorize" instead.
 */
export async function hasPermission(
  userId: string,
  projectIds: string[],
  permission: Permission,
): Promise<boolean> {
  return authorize(userId, projectIds, permission);
}
