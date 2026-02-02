// types/columns.type.ts
import { TaskCache, Task } from './task';
export interface Column {
  _id: string;
  projectId: string;
  name: string;
  color?: string;
  wipLimit: number;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ColumnCache extends Column {
  timestamp?: number;
}

export interface CombineColumnTask extends Column {
  tasks: Task[];
}
