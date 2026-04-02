import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type { tasksTable } from "@/db/schema";

export type TaskRow = InferSelectModel<typeof tasksTable>;
export type NewTaskRow = InferInsertModel<typeof tasksTable>;

export type TaskPriority = TaskRow["priority"];
export type Task = TaskRow;

export type CreateTaskPayload = Pick<
  NewTaskRow,
  | "columnId"
  | "title"
  | "description"
  | "orderFraction"
  | "tags"
  | "priority"
  | "dueDate"
>;

export type UpdateTaskPayload = Pick<
  NewTaskRow,
  | "id"
  | "columnId"
  | "title"
  | "description"
  | "orderFraction"
  | "tags"
  | "priority"
  | "dueDate"
  | "archived"
>;

export interface TaskCache extends Task {
  timestamp: number;
}

export interface PayloadMoveTask {
  activeTaskId: string;
  projectId: string;
  columnSouce: string;
  orderDestination: number;
  columnDestination: string;
}
