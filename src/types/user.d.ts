import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type { usersTable } from "@/db/schema";

export type User = InferSelectModel<typeof usersTable>;
export type NewUser = InferInsertModel<typeof usersTable>;

export interface UserCache extends User {
  timestamp: number;
}

/** What happens to a board or workspace the leaving owner had. */
export type DeletionChoice = "transfer" | "delete";

type Heir = { id: string; name: string } | null;

// what the Delete account dialog lists: things the user owns, and who would
// take each over (null: nobody else is in it, so it's deleted)
export type AccountDeletionPlan = {
  boards: {
    id: string;
    name: string;
    coverImage: string | null;
    settings: import("@/types/project-settings").ProjectSettings;
    memberCount: number;
    heir: Heir;
  }[];
  workspace: {
    id: string;
    name: string;
    logo: string | null;
    memberCount: number;
    heir: Heir;
  } | null;
};
