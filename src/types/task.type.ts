// types/task.type.ts
export interface Task {
  _id: string;             // ObjectId
  projectId: string;       // อ้างถึง Project
  columnId: string;        // อ้างถึง Column
  title: string;
  description?: string;
  assignees: string[];     // array ของ userId
  priority?: "low" | "medium" | "high";
  dueDate?: Date;
  tags?: string[];
  order: number;           // ใช้จัดเรียงภายใน column
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}
