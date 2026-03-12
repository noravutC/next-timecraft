import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type { usersTable } from "@/db/schema";

export type User = InferSelectModel<typeof usersTable>;
export type NewUser = InferInsertModel<typeof usersTable>;

export interface UserCache extends User {
  timestamp: number;
}
