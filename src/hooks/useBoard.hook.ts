// src/hooks/useBoard.hook.ts
import { create } from "zustand";
import { Column, ColumnCache, Task, TaskCache } from "@/types";
import { columnServices } from "@/lib/services/columns.service";
import { LoaderStatus } from "./hook.type";
import { toast } from "sonner";
import { useTaskStore } from "./useTasks.hook";

export interface BoardStore {
  lastFetchedBoard: number;
  columns: {
    [columnId: string]: ColumnCache;
  };
  // cache props
  groupColumnsOfProjectCache: {
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
    projectId: string | null | undefined
  ) => Promise<void>;

  // actions
  createColumn: (
    projectId: string,
    columnData: Partial<Column>
  ) => Promise<Column | null>;
  // moveTaskInStore: (taskId: string, newColumnId: string) => void;
}

export const useBoardStore = create<BoardStore>((set, get) => ({
  lastFetchedBoard: 0,
  columns: {},
  groupColumnsOfProjectCache: {},
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

  fetchBoardByProjectId: async (projectId: string | null | undefined) => {
    const { groupColumnsOfProjectCache } = get();
    const now = Date.now();
    if (!projectId) {
      toast.error("Not found project is activate.");
      return;
    }

    const cacheDuration = 1 * 60 * 1000;
    const currentProject = groupColumnsOfProjectCache[projectId];
    if (currentProject && now - currentProject.timestamp < cacheDuration) {
      console.log("Using cached column cache data.");
      return;
    } else {
      delete groupColumnsOfProjectCache[projectId]; //removed cache not use
    }
    try {
      set({ status: "fetching" });
      const response = await columnServices.getBoardsAndTasksByProjectId(
        projectId
      );
      const combineColsTasks = response?.data || [];

      const newColumnsCache: Record<string, ColumnCache> = {};
      const newTasks: Record<string, TaskCache> = {};
      // console.log('combineColsTasks: ', combineColsTasks);
      combineColsTasks.forEach((ct) => {
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
        groupColumnsOfProjectCache: {
          ...state.groupColumnsOfProjectCache,
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
  // moveTaskInStore: (taskId: string, newColumnId: string) => {
  //   set((state) => {
  //     const columns = state.columns;
  //     let movedTask: Task | undefined;

  //     // 1. ค้นหา Task และสร้าง Column ที่ถูกอัปเดต
  //     const updatedColumns = Object.values(columns).reduce((acc, col) => {
  //       // หาก Column นี้คือปลายทาง
  //       if (col._id === newColumnId) {
  //         acc[col._id] = col; // เก็บ Column ปลายทางไว้ก่อน
  //         return acc;
  //       }

  //       // หาก Column นี้ไม่ใช่ Column ปลายทาง (คือ Column ต้นทางหรือ Column อื่น)
  //       const taskIndex = col.tasks.findIndex((t) => t._id === taskId);

  //       if (taskIndex !== -1) {
  //         // 1.1 Task ถูกพบ: เก็บ Task ที่ถูกย้าย
  //         movedTask = col.tasks[taskIndex];

  //         // 1.2 อัปเดต Column ต้นทาง: ลบ Task ออก
  //         acc[col._id] = {
  //           ...col,
  //           tasks: col.tasks.filter((t) => t._id !== taskId),
  //         };
  //       } else {
  //         // 1.3 Column ที่ไม่มีการเปลี่ยนแปลง
  //         acc[col._id] = col;
  //       }
  //       return acc;
  //     }, {} as Record<string, ColumnWithBoardData>);

  //     // 2. เพิ่ม Task เข้าไปใน Column ใหม่
  //     if (movedTask && updatedColumns[newColumnId]) {
  //       const newCol = updatedColumns[newColumnId];

  //       // อัปเดตข้อมูล Column ID ของ Task และเพิ่มเข้าไป
  //       const taskWithNewColId = { ...movedTask, columnId: newColumnId };

  //       updatedColumns[newColumnId] = {
  //         ...newCol,
  //         tasks: [...newCol.tasks, taskWithNewColId],
  //       };
  //     }

  //     // คืนค่า State ใหม่
  //     return { columns: updatedColumns };
  //   });
  // },
}));
