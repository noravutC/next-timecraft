// types/template-column.tsx
export interface TemplateColumn {
  _id: string;          // ObjectId
  name: string;         // เช่น "To Do"
  color?: string;       // สี default
  wipLimit: number;     // ค่าเริ่มต้น
  order: number;        // ใช้จัดเรียง
  createdAt: Date;
  updatedAt: Date;
}
