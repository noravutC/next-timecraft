// src/hooks/useTasks.hook.ts
import { create } from "zustand";
import { Task, TaskCache } from "@/types";
import { taskServices } from "@/lib/services/tasks.service";
import { LoaderStatus } from "./hook.type";
import { toast } from "sonner";
import { useBoardStore } from "./useBoard.hook";

export interface TaskStore {
  tasks: Record<string, TaskCache>;
  taskLoaders: Record<string, boolean>;

  status: LoaderStatus;
  setStatus: (status: LoaderStatus) => void;

  // set
  moveTaskState: (taskId: string, targetColumnId: string, targetTaskId: string | null | undefined) => void;
  setUpdatedTask: (taskId: string, updatedTask: Partial<TaskCache>) => void;
  setTasks: (alreadyTasks: Record<string, TaskCache>) => void;
  clearTasks: () => void;

  // get
  getTaskById: (taskId: string | null | undefined) => Task | undefined;
  getTaskByColumnId: (columnId: string | null | undefined) => Task[];

  // fetch
  fetchTasksByColumnId: (
    columnId: string | null | undefined
  ) => Promise<Task[]>;
  // actions
  createTask: (data: Partial<Task>) => Promise<void>;
  updateTask: (taskId: string, data: Partial<Task>) => Promise<void>;
  moveTaskToColumn: (
    projectId: string,
    taskId: string,
    destinationColumnId: string
  ) => Promise<void>;

  // pusher realtime action
  addTaskFromRealtime: (createdTask: Task) => void;
  updateTaskFromRealtime: (updatedTask: Task) => void;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: {},
  taskLoaders: {},
  status: "none",

  setStatus: (status) => set({ status }),
  moveTaskState: (taskId, targetColumnId, targetTaskId) => {
    const { tasks } = get();
    const currentTask = tasks[taskId];
    if (!currentTask) return;

    const boardStore = useBoardStore.getState();

    // 1. หาว่าจริงๆ แล้วตอนนี้ Task สิงอยู่ที่ Column ไหน (Visual/Ghost Location)
    let sourceColumnId = currentTask.columnId;
    for (const [colId, colData] of Object.entries(boardStore.columnCombineTasks)) {
      if (colData.tasks.some(t => t._id === taskId)) {
        sourceColumnId = colId;
        break;
      }
    }

    const listTasks = boardStore.columnCombineTasks[targetColumnId]?.tasks ?? [];
    if (!listTasks) return;

    if (sourceColumnId === targetColumnId) {
      // --- Case 1: ย้ายภายใน Column เดิม (Same Column) ---
      const targetList = [...listTasks].sort((a, b) => a.order - b.order);

      const oldIndex = targetList.findIndex((t) => t._id === taskId);
      const newIndex = targetList.findIndex((t) => t._id === targetTaskId);

      if (oldIndex === -1 || newIndex === -1) return;

      const [movedItem] = targetList.splice(oldIndex, 1);

      if (newIndex !== -1) {
        targetList.splice(newIndex, 0, movedItem);
      } else {
        targetList.push(movedItem);
      }

      const newTasks = targetList.map((task, index) => ({
        ...task,
        order: index + 1
      }));

      useBoardStore.setState((state) => ({
        columnCombineTasks: {
          ...state.columnCombineTasks,
          [targetColumnId]: {
            ...state.columnCombineTasks[targetColumnId],
            tasks: newTasks
          }
        }
      }));

    } else {
      // --- Case 2: ย้ายข้าม Column (Different Column) ---

      // A. เตรียม Target List (ปลายทาง)
      // *สำคัญ*: กรองเอา taskId ออกก่อนเสมอ (กันเหนียวเผื่อมันหลุดไปอยู่แล้ว) แล้วค่อยแทรกใหม่
      // นี่คือเทคนิคที่ทำให้การ Reorder ข้าม Column นิ่งเหมือนใน Column เดียวกัน
      const targetList = [...listTasks]
        .filter(t => t._id !== taskId)
        .sort((a, b) => a.order - b.order);

      // B. เตรียม Source List (ต้นทาง) - ลบ Task ออก
      const sourceListRaw = boardStore.columnCombineTasks[sourceColumnId]?.tasks ?? [];
      const newSourceList = sourceListRaw
        .filter((t) => t._id !== taskId)
        .sort((a, b) => a.order - b.order)
        .map((t, index) => ({
          ...t,
          order: index + 1
        }));

      // C. Logic การแทรก (Insert)
      // หาตำแหน่งที่เราจะไปแทรก (ทับ)
      const targetIndex = targetList.findIndex((t) => t._id === targetTaskId);

      const updatedTask = {
        ...currentTask,
        columnId: targetColumnId, // เปลี่ยนบ้านใหม่
      };

      if (targetIndex !== -1) {
        // เจอเป้าหมาย: แทรกเข้าข้างหน้า (Insert Before) 
        // นี่คือ logic ที่ทำให้มันแทรกกลางวงได้เหมือน Same Column
        targetList.splice(targetIndex, 0, updatedTask);
      } else {
        // ไม่เจอเป้าหมาย (ลากลงที่ว่าง หรือล่างสุด): ต่อท้าย
        targetList.push(updatedTask);
      }

      // D. Re-order เลขใหม่
      const newTargetList = targetList.map((t, index) => ({
        ...t,
        order: index + 1
      }));

      // E. Update State
      useBoardStore.setState((state) => ({
        columnCombineTasks: {
          ...state.columnCombineTasks,
          [sourceColumnId]: {
            ...state.columnCombineTasks[sourceColumnId],
            tasks: newSourceList,
          },
          [targetColumnId]: {
            ...state.columnCombineTasks[targetColumnId],
            tasks: newTargetList,
          }
        }
      }));
    }
    console.log("Move from", sourceColumnId, "to", targetColumnId);
  },
  // moveTaskState: (taskId, targetColumnId, targetTaskId) => {
  //   const { tasks } = get();
  //   const currentTask = tasks[taskId];
  //   if (!currentTask) return;

  //   const boardStore = useBoardStore.getState();

  //   // --- จุดที่เพิ่ม: หาว่าจริงๆ แล้วตอนนี้ Task แสดงผลอยู่ที่ Column ไหน (Visual/Ghost Location) ---
  //   let sourceColumnId = currentTask.columnId; // ค่า Default คือค่าเดิม

  //   // วนหาว่า Task id นี้ ไปโผล่ที่ Column ไหนใน Store ปัจจุบัน
  //   for (const [colId, colData] of Object.entries(boardStore.columnCombineTasks)) {
  //       if (colData.tasks.some(t => t._id === taskId)) {
  //           sourceColumnId = colId; // เจอแล้ว! ตอนนี้มันสิงอยู่ที่นี่
  //           break;
  //       }
  //   }
  //   // -----------------------------------------------------------------------------------

  //   const listTasks = boardStore.columnCombineTasks[targetColumnId]?.tasks ?? [];
  //   if (!listTasks) return;

  //   // ตรงนี้เปลี่ยนจาก currentTask.columnId เป็น sourceColumnId ที่เราหามาตะกี้
  //   if (sourceColumnId === targetColumnId) {
  //     // --- Logic เดิมของคุณ (ย้ายใน Column เดียวกัน) ---
  //     const targetList = [...listTasks].sort((a, b) => a.order - b.order);

  //     const oldIndex = targetList.findIndex((t) => t._id === taskId);
  //     const newIndex = targetList.findIndex((t) => t._id === targetTaskId);

  //     if (oldIndex === -1 || newIndex === -1) return;

  //     const [movedItem] = targetList.splice(oldIndex, 1);

  //     // กรณีหา target ไม่เจอ หรือลากไปที่ว่าง ให้ใส่ตำแหน่งเดิม หรือต่อท้าย (กัน error)
  //     if (newIndex !== -1) {
  //         targetList.splice(newIndex, 0, movedItem);
  //     } else {
  //         targetList.push(movedItem);
  //     }

  //     const newTasks = targetList.map((task, index) => ({
  //       ...task,
  //       order: index + 1
  //     }));

  //     useBoardStore.setState((state) => ({
  //       columnCombineTasks: {
  //         ...state.columnCombineTasks,
  //         [targetColumnId]: {
  //           ...state.columnCombineTasks[targetColumnId],
  //           tasks: newTasks
  //         }
  //       }
  //     }));

  //   } else {
  //     // --- Logic เดิมของคุณ (ย้ายข้าม Column) ---
  //     const targetList = [...listTasks].sort((a, b) => a.order - b.order); // *ย้ายมาไว้ตรงนี้เพื่อให้ targetList สดใหม่เสมอ

  //     // 1. จัดการ Source Column: 
  //     // *แก้* ใช้ sourceColumnId แทน currentTask.columnId เพื่อลบออกจากที่ที่มันสิงอยู่จริง
  //     const sourceListRaw = boardStore.columnCombineTasks[sourceColumnId]?.tasks ?? [];

  //     const newSourceList = sourceListRaw
  //       .filter((t) => t._id !== taskId) // เอาตัวที่ย้ายออก
  //       .sort((a, b) => a.order - b.order)
  //       .map((t, index) => ({
  //            ...t,
  //            order: index + 1
  //       }));

  //     // 2. จัดการ Target Column (เหมือนเดิม)
  //     const targetIndex = targetList.findIndex((t) => t._id === targetTaskId);

  //     const updatedTask = {
  //         ...currentTask,
  //         columnId: targetColumnId,
  //     };

  //     if (targetIndex !== -1) {
  //         targetList.splice(targetIndex, 0, updatedTask);
  //     } else {
  //         targetList.push(updatedTask);
  //     }

  //     const newTargetList = targetList.map((t, index) => ({
  //         ...t,
  //         order: index + 1
  //     }));

  //     // 3. Update State
  //     useBoardStore.setState((state) => ({
  //       columnCombineTasks: {
  //         ...state.columnCombineTasks,
  //         // *แก้* Key ตรงนี้ต้องเป็น sourceColumnId ไม่งั้นมันจะไปลบผิด Column
  //         [sourceColumnId]: { 
  //           ...state.columnCombineTasks[sourceColumnId],
  //           tasks: newSourceList, 
  //         },
  //         [targetColumnId]: {
  //           ...state.columnCombineTasks[targetColumnId],
  //           tasks: newTargetList, 
  //         }
  //       }
  //     }));
  //   }
  //   console.log("Move from", sourceColumnId, "to", targetColumnId);
  // },
  // moveTaskState: (taskId, targetColumnId, targetTaskId) => {
  //   const { tasks } = get();
  //   const currentTask = tasks[taskId];
  //   if (!currentTask) return;

  //   const boardStore = useBoardStore.getState();
  //   const listTasks = boardStore.columnCombineTasks[targetColumnId]?.tasks ?? [];
  //   if (!listTasks) return;

  //   const targetList = [...listTasks].sort((a, b) => a.order - b.order);

  //   if (currentTask.columnId === targetColumnId) {
  //     //Logic to move task in same column
  //     const oldIndex = targetList.findIndex((t) => t._id === taskId);
  //     const newIndex = targetList.findIndex((t) => t._id === targetTaskId);

  //     if (oldIndex === -1 || newIndex === -1) return;

  //     const [movedItem] = targetList.splice(oldIndex, 1);
  //     targetList.splice(newIndex, 0, movedItem);

  //     const newTasks = targetList.map((task, index) => ({
  //       ...task,
  //       order: index + 1
  //     }));

  //     useBoardStore.setState((state) => ({
  //       columnCombineTasks: {
  //         ...state.columnCombineTasks,
  //         [targetColumnId]: {
  //           ...state.columnCombineTasks[targetColumnId],
  //           tasks: newTasks
  //         }
  //       }
  //     }));
  //     //end logic to move task in same column
  //   } else {
  //     // 1. จัดการ Source Column (Column เดิม): ลบ Task ออก และรันเลข Order ใหม่
  //     const sourceListRaw = boardStore.columnCombineTasks[currentTask.columnId]?.tasks ?? [];
  //     const newSourceList = sourceListRaw
  //       .filter((t) => t._id !== taskId) // เอาตัวที่ย้ายออก
  //       .sort((a, b) => a.order - b.order)
  //       .map((t, index) => ({
  //            ...t,
  //            order: index + 1
  //       }));

  //     // 2. จัดการ Target Column (Column ใหม่): แทรก Task เข้าไป
  //     const targetIndex = targetList.findIndex((t) => t._id === targetTaskId);

  //     // สร้าง Object Task ใหม่ที่อัปเดต ColumnId แล้ว
  //     const updatedTask = {
  //         ...currentTask,
  //         columnId: targetColumnId, // *สำคัญ* ต้องเปลี่ยน Column ID
  //         // order จะถูกทับในขั้นตอนถัดไป
  //     };

  //     if (targetIndex !== -1) {
  //         // กรณีวางแทรกระหว่าง Task อื่น
  //         targetList.splice(targetIndex, 0, updatedTask);
  //     } else {
  //         // กรณีวางลงใน Column เปล่า หรือวางต่อท้ายสุด (ถ้าหา target ไม่เจอ)
  //         targetList.push(updatedTask);
  //     }

  //     // รันเลข Order ของ Target ใหม่
  //     const newTargetList = targetList.map((t, index) => ({
  //         ...t,
  //         order: index + 1
  //     }));

  //     // 3. Update State ทีเดียวทั้ง 2 Column
  //     useBoardStore.setState((state) => ({
  //       columnCombineTasks: {
  //         ...state.columnCombineTasks,
  //         [currentTask.columnId]: {
  //           ...state.columnCombineTasks[currentTask.columnId],
  //           tasks: newSourceList, // อัปเดต list เดิม (ของหาย 1)
  //         },
  //         [targetColumnId]: {
  //           ...state.columnCombineTasks[targetColumnId],
  //           tasks: newTargetList, // อัปเดต list ใหม่ (ของเพิ่ม 1)
  //         }
  //       }
  //     }));

  //     // *Optional* หาก state `tasks` (ที่เป็น Flat Object) ใน store ของคุณ
  //     // จำเป็นต้องถูกอัปเดต ColumnId ด้วย ให้ทำตรงนี้ (ขึ้นอยู่กับการออกแบบ Store ของคุณ)
  //     // set((state) => ({
  //     //    tasks: { ...state.tasks, [taskId]: { ...state.tasks[taskId], columnId: targetColumnId } }
  //     // }))
  //   }
  //   console.log("target col and target task", targetColumnId, targetTaskId);
  // },
  setUpdatedTask: (taskId, updatedTask) => {
    set((state) => ({
      tasks: {
        ...state.tasks,
        [taskId]: {
          ...state.tasks[taskId],
          ...updatedTask,
        },
      },
    }));
  },

  setTasks: (alreadyTasks: Record<string, TaskCache>) => {
    set((state) => ({
      tasks: {
        ...state.tasks,
        ...alreadyTasks,
      },
    }));
  },

  clearTasks: () => set({ tasks: {} }),

  getTaskById: (taskId: string | null | undefined) => {
    return get().tasks[taskId ?? ""];
  },

  getTaskByColumnId: (columnId: string | null | undefined) => {
    const allStateColumns = get().tasks;
    const filteredColumns = Object.values(allStateColumns).filter(
      (col) => col.columnId === (columnId ?? "")
    );
    return filteredColumns;
  },

  fetchTasksByColumnId: async (columnId: string | null | undefined) => {
    try {
      set({ status: "fetching" });
      const response = await taskServices.getTasksByColumnId(columnId ?? "");
      const tasks = response?.data || [];

      return tasks;
    } catch (error) {
      console.log("Failed to fetch projects:", error);
      throw error;
    } finally {
      set({ status: "none" });
    }
  },

  addTaskFromRealtime: (createdTask: Task) => {
    set((state) => ({
      tasks: {
        ...state.tasks,
        [createdTask._id]: { ...createdTask, timestamp: Date.now() }
      }
    }))
  },

  updateTaskFromRealtime: (updatedTask: Task) => {
    set((state) => ({
      tasks: {
        ...state.tasks,
        [updatedTask._id]: { ...updatedTask, timestamp: Date.now() }
      }
    }))
  },

  createTask: async (data: Partial<Task>) => {
    try {
      set({ status: "creating" });
      const response = await taskServices.createTask(data);
      // const createdTask = response?.created;

      // if (createdTask) {
      //   set((state) => ({
      //     tasks: {
      //       ...state.tasks,
      //       [createdTask._id]: { ...createdTask, timestamp: Date.now() }
      //     }
      //   }))
      // }
    } catch (error) {
      console.log("Failed to create task:", error);
      throw error;
    } finally {
      set({ status: "none" });
    }
  },

  updateTask: async (taskId: string, data: Partial<Task>) => {
    try {
      set({ status: "updating" });
      const response = await taskServices.updateOneTask(taskId, data);
      // const updatedTask = response?.updated;

      // if (updatedTask) {
      //   set((state) => ({
      //     tasks: {
      //       ...state.tasks,
      //       [updatedTask._id]: { ...updatedTask, timestamp: Date.now() }
      //     }
      //   }))
      // }
    } catch (error) {
      console.log("Failed to update task:", error);
      throw error;
    } finally {
      set({ status: "none" });
    }
  },

  moveTaskToColumn: async (projectId: string, taskId: string, destinationColumnId: string) => {
    const { tasks } = get();
    const currentTaskValues = tasks[taskId];
    try {
      set({ status: "updating" });
      if (projectId === '' || taskId === '' || destinationColumnId === '') {
        toast.error('Missing project, task or destination column.');
        return;
      }
      if (!currentTaskValues) {
        toast.error('Unknow current task.');
        return;
      }
      set((state) => ({
        tasks: {
          ...state.tasks,
          [taskId]: { ...currentTaskValues, columnId: destinationColumnId },
        },
        taskLoaders: {
          ...state.taskLoaders,
          [taskId]: true,
        },
      }))

      const response = await taskServices.moveTaskToColumn(
        projectId,
        taskId,
        destinationColumnId
      );
      // const updatedTask = response?.updated;

      // if (updatedTask) {
      //   get().setUpdatedTask(updatedTask._id, updatedTask);
      // } else {
      //   console.log("No updated task returned from the service");
      // }
    } catch (error) {
      console.log("Failed to move task to column:", error);
      // If error back to old task values.
      set((state) => ({
        tasks: {
          ...state.tasks,
          [taskId]: currentTaskValues,
        },
      }))
      throw error;
    } finally {
      set({ status: "none" });
      set((state) => ({
        taskLoaders: {
          ...state.taskLoaders,
          [taskId]: false,
        },
      }))
    }
  },
}));
