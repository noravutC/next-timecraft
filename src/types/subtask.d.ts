import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type { subtasksTable } from "@/db/schema";

export type SubtaskRow = InferSelectModel<typeof subtasksTable>;
export type NewSubtaskRow = InferInsertModel<typeof subtasksTable>;
export type Subtask = SubtaskRow;

export interface CreateSubtaskPayload {
  title: string;
  orderFraction: string;
}

export interface UpdateSubtaskPayload {
  title?: string;
  completed?: boolean;
  orderFraction?: string;
}
