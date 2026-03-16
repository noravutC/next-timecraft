import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type { columnsTable } from "@/db/schema";
import type { Task } from "./task";

export type ColumnRow = InferSelectModel<typeof columnsTable>;
export type NewColumnRow = InferInsertModel<typeof columnsTable>;

export type Column = ColumnRow;

export type CreateColumnPayload = Pick<
  NewColumnRow,
  "name" | "projectId" | "color" | "orderFraction" | "wipLimit"
>;

export type UpdateColumnPayload = Pick<
  NewColumnRow,
  "id" | "name" | "color" | "wipLimit" | "orderFraction"
>;

export interface ColumnCache extends Column {
  timestamp: number;
}
