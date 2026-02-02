// src/hooks/useTasks.hook.ts
import { create } from "zustand";
import { PayloadMoveTask, Task, TaskCache } from "@/types";
import { taskServices } from "@/lib/services/tasks.service";
import { LoaderStatus } from "./hook.type";
import { toast } from "sonner";
import { useBoardStore } from "./useBoard.hook";
import { insertIndexTo } from "@/helper/utils/re-order";
import { toRecord } from "@/helper/utils/object";

export interface TaskStore {
  tasks: {
    [taskId: string]: TaskCache;
  };
  dropTask: { taskId: string | null | undefined, columnId: string, order: number } | undefined;
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
    destinationColumnId: string,
    taskOrder?: number,
  ) => Promise<void>;
  moveTaskTo: (
    projectId: string,
    activeTaskId: string,
    columnSource: string,
    columnDestination: string,
    orderDestination: number,
  ) => Promise<void>;

  // pusher realtime action
  addTaskFromRealtime: (createdTask: Task) => void;
  updateTaskFromRealtime: (updatedTask: Task) => void;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: {},
  dropTask: undefined,
  taskLoaders: {},
  status: "none",

  setStatus: (status) => set({ status }),
  moveTaskState: (taskId, targetColumnId, targetTaskId) => {
    const { tasks } = get();
    const currentTask = tasks[taskId];
    if (!currentTask) return;
    const boardStore = useBoardStore.getState();

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
      // const targetList = [...listTasks].sort((a, b) => a.order - b.order);

      // const oldIndex = targetList.findIndex((t) => t._id === taskId);
      // const newIndex = targetList.findIndex((t) => t._id === targetTaskId);

      // if (oldIndex === -1 || newIndex === -1) return;

      // const [movedItem] = targetList.splice(oldIndex, 1);

      // if (newIndex !== -1) {
      //   targetList.splice(newIndex, 0, movedItem);
      // } else {
      //   targetList.push(movedItem);
      // }

      // const newTasks = targetList.map((task, index) => ({
      //   ...task,
      //   order: index + 1
      // }));
      const newTasks = insertIndexTo(
        listTasks,
        {
          orderKey: 'order',
          keyFindIndex: '_id',
        },
        {
          oldValue: taskId,
          newValue: targetTaskId ?? '',
        }
      );

      useBoardStore.setState((state) => ({
        columnCombineTasks: {
          ...state.columnCombineTasks,
          [targetColumnId]: {
            ...state.columnCombineTasks[targetColumnId],
            tasks: newTasks
          }
        }
      }));
      set((state) => {
        const updates: Record<string, TaskCache> = {};
        newTasks.forEach((t) => {
          updates[t._id] = { ...t, timestamp: Date.now() };
        });
        const targetTask = state.tasks[targetTaskId ?? ''];
        return {
          dropTask: {
            taskId: targetTaskId,
            columnId: targetColumnId,
            order: targetTask ? targetTask.order : 1,
          },
          tasks: {
            ...state.tasks,
            ...updates
          },
        };
      });

    } else {
      const sourceListRaw = boardStore.columnCombineTasks[sourceColumnId]?.tasks ?? [];
      const newSourceList = sourceListRaw
        .filter((t) => t._id !== taskId)
        .sort((a, b) => a.order - b.order)
        .map((t, index) => ({
          ...t,
          order: index + 1
        }));
      const updatedTask = {
        ...currentTask,
        columnId: targetColumnId,
      };
      const newTasks = insertIndexTo(
        listTasks,
        {
          orderKey: 'order',
          keyFindIndex: '_id',
        },
        {
          newValue: targetTaskId ?? '',
        },
        updatedTask,
      );
      const recordNewTasks = toRecord([...newTasks, ...newSourceList as Task[]], '_id')
      // const targetList = [...listTasks]
      //   .filter(t => t._id !== taskId)
      //   .sort((a, b) => a.order - b.order);
      // const targetIndex = targetList.findIndex((t) => t._id === targetTaskId);
      // if (targetIndex !== -1) {
      //   targetList.splice(targetIndex, 0, updatedTask);
      // } else {
      //   targetList.push(updatedTask);
      // }
      // const newTargetList = targetList.map((t, index) => ({
      //   ...t,
      //   order: index + 1
      // }));

      useBoardStore.setState((state) => ({
        columnCombineTasks: {
          ...state.columnCombineTasks,
          [sourceColumnId]: {
            ...state.columnCombineTasks[sourceColumnId],
            tasks: newSourceList,
          },
          [targetColumnId]: {
            ...state.columnCombineTasks[targetColumnId],
            tasks: newTasks,
          }
        }
      }));

      set((state) => {
        // const updates: Record<string, TaskCache> = {};
        // newSourceList.forEach((t) => {
        //   updates[t._id] = { ...t, timestamp: Date.now() };
        // });

        // newTasks.forEach((t) => {
        //   updates[t._id] = { ...t, timestamp: Date.now() };
        // });

        const targetTask = state.tasks[targetTaskId ?? ''];
        return {
          dropTask: {
            taskId: targetTaskId,
            columnId: targetColumnId,
            order: targetTask ? targetTask.order : 1,
          },
          tasks: {
            ...state.tasks,
            ...recordNewTasks
          }
        };
      });
    }
  },
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
      const createdTask = response?.created;

      if (createdTask) {
        set((state) => ({
          tasks: {
            ...state.tasks,
            [createdTask._id]: { ...createdTask, timestamp: Date.now() }
          }
        }))
        useBoardStore.setState((state) => {
          const columnId = createdTask.columnId;
          const column = state.columnCombineTasks[columnId];
          if (!column) {
            return state;
          }
          const existingTasks = column.tasks ? [...column.tasks] : [];
          const nextOrder = createdTask.order ?? (existingTasks.length > 0
            ? Math.max(...existingTasks.map((t) => t.order)) + 1
            : 1);
          const nextTask = { ...createdTask, order: nextOrder };
          const updatedTasks = [...existingTasks, nextTask].sort((a, b) => a.order - b.order);
          return {
            columnCombineTasks: {
              ...state.columnCombineTasks,
              [columnId]: {
                ...column,
                tasks: updatedTasks,
              },
            },
          };
        })
      }
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

  moveTaskToColumn: async (projectId: string, taskId: string, destinationColumnId: string, taskOrder?: number) => {
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

      await taskServices.moveTaskToColumn(
        projectId,
        taskId,
        destinationColumnId
      );
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
      set((state) => ({
        status: "none",
        taskLoaders: {
          ...state.taskLoaders,
          [taskId]: false,
        },
      }))
    }
  },
  moveTaskTo: async (
    projectId: string,
    activeTaskId: string,
    columnSouce: string,
    columnDestination: string,
    orderDestination: number,
  ) => {
    //every order start with 1 not 0
    const { tasks } = get();
    const { columnCombineTasks } = useBoardStore.getState()
    const currentTaskValues = tasks[activeTaskId];
    if (!currentTaskValues) {
      toast.error('Not found task.');
      return;
    }
    if (!columnDestination || !columnSouce || orderDestination < 1 || projectId === '') {
      toast.error('Not found destination.');
      return;
    }
    const payloadMoveTask: PayloadMoveTask = {
      activeTaskId,
      projectId,
      columnSouce,
      orderDestination,
      columnDestination,
    }
    try {
      set((state) => ({
        status: 'updating',
        taskLoaders: {
          ...state.taskLoaders,
          [activeTaskId]: true,
        }
      }));
      const jsonPayload = JSON.stringify(payloadMoveTask);
      await taskServices.moveTaskToDestination(activeTaskId, jsonPayload);

    } catch (error) {
      console.log("Failed cannot move task to destination:", error);
    } finally {
      set((state) => ({
        status: 'none',
        taskLoaders: {
          ...state.taskLoaders,
          [activeTaskId]: false,
        }
      }));
    }
  }
}));
