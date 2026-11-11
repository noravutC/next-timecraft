import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type { columnsTable } from "@/db/schema";

export type ColumnRow = InferSelectModel<typeof columnsTable>;
export type NewColumnRow = InferInsertModel<typeof columnsTable>;

export type Column = ColumnRow;

export type CreateColumnPayload = Pick<
  NewColumnRow,
  "name" | "projectId" | "color" | "orderFraction" | "wipLimit"
>;

/** id plus only the fields that change (the API leaves the rest alone) */
export type UpdateColumnPayload = Pick<NewColumnRow, "id"> &
  Partial<
    Pick<
      NewColumnRow,
      "name" | "color" | "wipLimit" | "orderFraction" | "isDone"
    >
  >;

export interface ColumnCache extends Column {
  timestamp: number;
}
