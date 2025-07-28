// types/columns.type.ts
import { Task }from "./task.type";
import { ObjectId } from "mongodb";

export interface Columns {
    column_id: ObjectId;
    column_name: string;
    tasks: Task[];
}