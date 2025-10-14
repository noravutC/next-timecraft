// types/member-ship
export type MembershipRole = "owner" | "admin" | "member" | "guest";

export interface Membership {
  _id?: string;
  userId: string;
  organizationId: string;
  role?: MembershipRole;
  createdAt?: Date;
  updatedAt?: Date;
};