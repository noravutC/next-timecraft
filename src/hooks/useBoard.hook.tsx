// src/hooks/useBoard.hook.ts
import { create } from "zustand";
import { Column, ColumnCache, CombineColumnTask, Task, TaskCache } from "@/types";
import { columnServices } from "@/lib/services/columns.service";
import { LoaderStatus } from "./hook.type";
import { toast } from "sonner";
import { useTaskStore } from "./useTasks.hook";

export interface BoardStore {
  lastFetchedBoard: number;
  columns: {
    [columnId: string]: ColumnCache;
  };
  columnCombineTasks: {
    [columnId: string]: CombineColumnTask;
  };
  // cache props
  columnsBarOfProjectCache: {
    [projectId: string]: {
      timestamp: number;
      columns: ColumnCache[];
    };
  };
  // columnsCache: Record<string, ColumnCache>;

  status: LoaderStatus;
  setStatus: (status: LoaderStatus) => void;
  clearColumns: () => void;

  // get
  getColumnById: (columnId: string) => Column | undefined;
  getColumnsByProjectId: (projectId: string | null | undefined) => Column[];

  // fetch
  fetchBoardByProjectId: (
    projectId: string | null | undefined,
    reqLiveBoards?: boolean,
  ) => Promise<void>;

  // actions
  createColumn: (
    projectId: string,
    columnData: Partial<Column>
  ) => Promise<Column | null>;
  insertColumnInOrder: (
    projectId: string,
    columnData: Partial<Column>,
    order: number
  ) => Promise<Column | null>;
  updateColumn: (
    columnId: string,
    columnData: Partial<Column>
  ) => Promise<void>;
  updateColumnOrder: (
    columnId: string,
    columnData: Partial<Column>
  ) => Promise<void>;
  softDeleteColumn: (columnId: string) => Promise<void>;
  // moveTaskInStore: (taskId: string, newColumnId: string) => void;
}

export const useBoardStore = create<BoardStore>((set, get) => ({
  lastFetchedBoard: 0,
  columns: {},
  columnCombineTasks: {},
  columnsBarOfProjectCache: {},
  status: "none",

  setStatus: (status) => set({ status }),

  clearColumns: () => set({ columns: {} }),

  getColumnById: (columnId: string) => {
    return get().columns[columnId];
  },

  getColumnsByProjectId: (projectId: string | null | undefined) => {
    const allStateColumns = get().columns;
    const filteredColumns = Object.values(allStateColumns).filter(
      (col) => col.projectId === projectId
    );
    return filteredColumns;
  },

  fetchBoardByProjectId: async (projectId: string | null | undefined, reqLiveBoards?: boolean) => {
    const { columnsBarOfProjectCache } = get();
    const now = Date.now();
    if (!projectId) {
      toast.error("Not found project is activate.");
      return;
    }

    if (!reqLiveBoards) {
      const cacheDuration = 1 * 60 * 1000;
      const currentProject = columnsBarOfProjectCache[projectId];
      if (currentProject && now - currentProject.timestamp < cacheDuration) {
        console.log("Using cached column cache data.");
        return;
      } else {
        delete columnsBarOfProjectCache[projectId]; //removed cache not use
      }
    }
    try {
      set({ status: "fetching" });
      const response = await columnServices.getBoardsAndTasksByProjectId(
        projectId
      );
      const combineColsTasks = response?.data || [];
      const newCombineColsTasks: Record<string, CombineColumnTask> = {};
      const newColumnsCache: Record<string, ColumnCache> = {};
      const newTasks: Record<string, TaskCache> = {};
      combineColsTasks.forEach((ct) => {
        newCombineColsTasks[ct._id] = ct;
        newColumnsCache[ct._id] = {
          ...ct,
          timestamp: now,
        } as ColumnCache;

        if (ct.tasks.length > 0) {
          ct.tasks.forEach((t) => {
            newTasks[t._id] = { ...t, timestamp: now } as TaskCache;
          });
        }
      });
      // apply group columns after timestamp
      const newColumns = Object.values(newColumnsCache);


      set((state) => ({
        lastFetchedBoard: now,
        columns: {
          ...state.columns,
          ...newColumnsCache,
        },
        columnCombineTasks: {
          ...state.columnCombineTasks,
          ...newCombineColsTasks,
        },
        columnsBarOfProjectCache: {
          ...state.columnsBarOfProjectCache,
          [projectId]: {
            timestamp: now,
            columns: newColumns
          },
        }
      }));
      // apply tasks into store
      const taskStore = useTaskStore.getState();
      taskStore.setTasks(newTasks);
    } catch (error) {
      console.log("Failed to fetch board by project id:", error);
      throw error;
    } finally {
      set({ status: "none" });
    }
  },

  createColumn: async (projectId: string, columnData: Partial<Column>) => {
    try {
      set({ status: "creating" });
      const response = await columnServices.createColumn(
        projectId ?? "",
        columnData
      );
      const column = response?.created;

      if (column) {
        // get().setColumn(column._id, column);
      }

      return column;
    } catch (error) {
      console.log("Failed to create column:", error);
      throw error;
    } finally {
      set({ status: "none" });
    }
  },
  insertColumnInOrder: async (projectId: string, columnData: Partial<Column>, order: number) => {
    const { fetchBoardByProjectId } = get();
    try {
      set({ status: "creating" });
      const response = await columnServices.insertColumnInOrder(
        projectId ?? "",
        columnData,
        order
      );
      const column = response?.created;

      if (column) {

        await fetchBoardByProjectId(projectId, true);
        // get().setColumn(column._id, column);
      }
      return column;
    } catch (error) {
      console.log("Failed to insert column in order:", error);
      throw error;
    } finally {
      set({ status: "none" });
    }
  },
  updateColumn: async (columnId: string, columnData: Partial<Column>) => {
    try {
      set({ status: "updating" });
      const response = await columnServices.updateColumn(
        columnId,
        columnData
      );
      // console.log('response: ', response);
      const updatedColumn = response.updated;
      if (!updatedColumn) {
        toast.error("Failed to update column.");
        return;
      }
      // Update column in store
      set((state) => ({
        columns: {
          ...state.columns,
          [updatedColumn._id]: {
            ...state.columns[columnId],
            ...updatedColumn,
          },
        },
      }));
    } catch (error) {
      console.log("Failed to update column:", error);
      throw error;
    } finally {
      set({ status: "none" });
    }
  },
  updateColumnOrder: async (columnId: string, columnData: Partial<Column>) => {
    // const { fetchBoardByProjectId } = get();
    try {
      set({ status: "updating" });

      const response = await columnServices.updateOnlyColumnOrder(columnId, columnData);
      let updatedColumns = response.updated;
      // console.log('response updateColumnOrder: ', updatedColumns);
      if (!updatedColumns) {
        toast.error("Failed to update column.");
        return;
      }

      if (!Array.isArray(updatedColumns)) updatedColumns = [updatedColumns];

      const now = Date.now();
      const projectId = updatedColumns[0].projectId;

      // แปลง updatedColumns เป็น ColumnCache
      const updatedColumnsCache: ColumnCache[] = updatedColumns.map((col) => ({
        ...col,
        timestamp: now,
      }));

      // ดึง columns เดิมของ project
      const prevColumns = Object.values(get().columns).filter(c => c.projectId === projectId);

      // merge columns เก่าและใหม่
      const mergedColumns: ColumnCache[] = [
        ...prevColumns.filter(c => !updatedColumnsCache.some(u => u._id === c._id)),
        ...updatedColumnsCache,
      ];

      // สร้าง columns map
      const newColumnsCache: Record<string, ColumnCache> = {};
      mergedColumns.forEach((col) => {
        newColumnsCache[col._id] = col;
      });

      // set state
      set((state) => ({
        columns: {
          ...state.columns,
          ...newColumnsCache,
        },
        columnsBarOfProjectCache: {
          ...state.columnsBarOfProjectCache,
          [projectId]: {
            timestamp: now,
            columns: mergedColumns,
          },
        },
      }));

      console.log("after apply update column", Object.values(get().columns));
    } catch (error) {
      console.log("Failed to update column:", error);
      throw error;
    } finally {
      set({ status: "none" });
    }
  },
  softDeleteColumn: async (columnId: string) => {
    try {
      set({ status: "deleting" });
      const response = await columnServices.softDeleteColumn(columnId);
      const deletedColumn = response.deleted;
      if (!deletedColumn) {
        toast.error("Failed to delete column.");
        return;
      }
      // Remove column from store
      set((state) => {
        const newColumns = { ...state.columns };
        delete newColumns[columnId];
        return { columns: newColumns };
      });
    } catch (error) {
      console.log("Failed to delete column:", error);
      throw error;
    } finally {
      set({ status: "none" });
    }
  },
}));
