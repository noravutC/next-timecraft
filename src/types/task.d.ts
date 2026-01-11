// types/task.type.ts
export interface Task {
  _id: string;
  projectId: string;
  columnId: string;
  title: string;
  description?: string;
  assignees: string[];
  priority?: "low" | "medium" | "high";
  dueDate?: Date;
  tags?: string[];
  order: number;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskCache extends Task {
  timestamp?: number;
}

export interface PayloadMoveTask {
  activeTaskId: string;
  projectId: string;
  columnSouce: string;
  orderDestination: number;
  columnDestination: string;
}
