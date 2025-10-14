export type ColumnColor = 
  | "purple"
  | "pink"
  | "blue"
  | "yellow"
  | "green"
  | "indigo"
  | "orange"
  | "teal";

export interface Task {
  id: string;
  title: string;
  description?: string;
  columnId: string;
  order: number;
}

export interface Column {
  id: string;
  title: string;
  color: ColumnColor;
  order: number;
}
