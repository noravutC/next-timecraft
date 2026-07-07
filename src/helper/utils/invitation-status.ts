import type { InvitationStatus, ProjectInvitationRow } from "@/types";

// สถานะคำเชิญ derive จาก timestamps — revoked ชนะ accepted ชนะ expired
export function invitationStatus(
  inv: Pick<ProjectInvitationRow, "acceptedAt" | "revokedAt" | "expiresAt">,
  now: Date = new Date(),
): InvitationStatus {
  if (inv.revokedAt) return "revoked";
  if (inv.acceptedAt) return "accepted";
  if (inv.expiresAt <= now) return "expired";
  return "pending";
}
