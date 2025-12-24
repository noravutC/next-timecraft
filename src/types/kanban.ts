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

export interface TempColumn {
  id: string;
  projectId: string;
  title: string;
  order: number;
}

export interface TempTask {
  id: string;
  columnId: string;
  title: string;
  order: number;
}