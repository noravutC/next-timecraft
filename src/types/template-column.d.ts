export interface TemplateColumn {
  _id: string;
  name: string;
  description: string;
  columns: {
    name: string;
    color: string;
    wipLimit: number;
    order: number;
  }[];
  createdBy: string;
}
