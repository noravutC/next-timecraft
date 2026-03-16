import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type { organizationsTable } from "@/db/schema";

export type Organizations = InferSelectModel<typeof organizationsTable>;
export type NewOrganizationRow = InferInsertModel<typeof organizationsTable>;
export type CreateOrganizationPayload = Pick<
  NewOrganizationRow,
  "name" | "description"
>;

export interface OrganizationCache extends Organizations {
  timestamp: number;
}
