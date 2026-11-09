import type { InvitationStatus, ProjectInvitationRow } from "@/types";
import { initialsOf, shortName } from "./person-name";

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

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** "expires in 6 days" · "expires in 1 day" · "expires in less than a day" */
export function invitationExpiryLabel(
  expiresAt: Date | string,
  now: Date = new Date(),
): string {
  const remaining = new Date(expiresAt).getTime() - now.getTime();
  if (remaining <= 0) return "expired";
  const days = Math.floor(remaining / MS_PER_DAY);
  if (days === 0) return "expires in less than a day";
  return `expires in ${days} ${days === 1 ? "day" : "days"}`;
}

/** Initials for someone who hasn't joined yet: "jane.lee@x.com" → "JL" */
export const inviteeInitials = (email: string): string =>
  initialsOf(email.split("@")[0].replace(/[._+-]+/g, " "));

/** "Invited as Editor · expires in 6 days" (a board invitation) */
export const boardInvitationMeta = (
  roleLabel: string,
  expiresAt: Date | string,
  now: Date = new Date(),
): string => `Invited as ${roleLabel} · ${invitationExpiryLabel(expiresAt, now)}`;

/** "Member · invited by you · expires in 6 days" (a workspace invitation) */
export const workspaceInvitationMeta = (
  invitation: {
    roleLabel: string;
    invitedByName: string | null;
    invitedByYou: boolean;
    expiresAt: Date | string;
  },
  now: Date = new Date(),
): string =>
  [
    invitation.roleLabel,
    invitation.invitedByYou
      ? 'invited by you'
      : invitation.invitedByName
        ? `invited by ${shortName(invitation.invitedByName)}`
        : null,
    invitationExpiryLabel(invitation.expiresAt, now),
  ]
    .filter(Boolean)
    .join(' · ');
