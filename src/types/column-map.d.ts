// types/column-map.d.ts
import { ColumnCache } from "./column";
import { TaskCache } from "./task";

export interface ColumnMapTask extends ColumnCache {
  taskInColumn: {
    [taskId: string]: TaskCache;
  };
}

