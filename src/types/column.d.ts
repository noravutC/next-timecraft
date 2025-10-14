// types/columns.type.ts
export interface Column {
  _id: string;             // ObjectId
  projectId: string;       // อ้างถึง Project
  name: string;
  color?: string;
  wipLimit: number;        // work-in-progress limit
  order: number;           // ใช้จัดเรียง
  createdAt: Date;
  updatedAt: Date;
}
