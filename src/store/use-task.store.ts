import { create } from 'zustand';
import {
  CreateTaskPayload,
  Task,
  TaskCache,
  TaskPageInfo,
  UpdateTaskPayload,
} from '@/types';
import { LoaderStatus } from '@/types/global/types';
import { taskServices } from '@/services/tasks.service';
import { toRecord, toValueRecord } from '@/helper/utils/object';
import { toast } from 'sonner';
import { useColumnStore } from './use-column.store';
import { useAssigneeStore } from './use-assignee.store';
import { useBoardFilterStore } from './use-board-filter.store';

type TaskStore = {
  status: LoaderStatus;
  tasks: { [taskId: string]: TaskCache };
  tasksLoader: {
    [taskId: string]: boolean;
  };
  // per-column pagination: what's loaded so far + where the next page starts
  taskPages: { [columnId: string]: TaskPageInfo };
  loadMoreLoader: { [columnId: string]: boolean };
  createTasks: (payload: CreateTaskPayload[]) => Promise<TaskCache[] | null>;
  updateTasks: (
    taskIds: string[],
    payload: UpdateTaskPayload[],
  ) => Promise<TaskCache[] | null>;
  deleteTasks: (taskIds: string[]) => Promise<void>;
  fetchTasksByColumns: (
    colIds: string[],
    limitTasks: number,
  ) => Promise<TaskCache[]>;
  loadMoreTasks: (columnId: string) => Promise<TaskCache[]>;
  /** Upper orderFraction bound for "append at end" while the column tail is unloaded. */
  columnEndBound: (columnId: string) => string | null;
  updateTaskFromRealtime: (task: Task) => void;
  addTasksFromRealtime: (tasks: Task[]) => void;
  removeTasksFromRealtime: (taskIds: string[]) => void;
};

let updateReqCounter = 0;
const latestUpdateReqByTask: Record<string, number> = {};

export const TASK_PAGE_SIZE = 20;

// task ที่อยู่ลึกกว่า cursor ของ column ที่ยังโหลดไม่ครบ = อยู่นอกหน้าต่างที่โหลดแล้ว
const isBeyondLoadedWindow = (
  taskPages: Record<string, TaskPageInfo>,
  task: Pick<Task, 'columnId' | 'orderFraction'>,
) => {
  const page = taskPages[task.columnId];
  return Boolean(
    page?.hasMore &&
    page.nextCursor &&
    (task.orderFraction ?? '') > page.nextCursor.orderFraction,
  );
};

export const useTaskStore = create<TaskStore>((set, get) => ({
  status: 'none',
  tasks: {},
  tasksLoader: {},
  taskPages: {},
  loadMoreLoader: {},
  createTasks: async (payload) => {
    if (payload.length === 0) {
      toast.error('No tasks to create');
      return null;
    }
    set({ status: 'creating' });
    try {
      const response = await taskServices.createTasks(payload);
      const createdTasks = response.created;
      if (!createdTasks || createdTasks.length === 0) {
        set({ status: 'none' });
        return null;
      }
      set((state) => ({
        tasks: { ...state.tasks, ...toRecord(createdTasks, 'id') },
        status: 'none',
      }));
      return createdTasks;
    } catch (error) {
      set({ status: 'error' });
      throw error;
    }
  },

  updateTasks: async (taskIds, payload) => {
    if (!taskIds.length || !payload.length) return null;

    const reqId = ++updateReqCounter;
    taskIds.forEach((id) => {
      latestUpdateReqByTask[id] = reqId;
    });
    const snapshotByTask = Object.fromEntries(
      taskIds.map((id) => [id, useTaskStore.getState().tasks[id]]),
    );

    set((state) => ({
      tasksLoader: { ...state.tasksLoader, ...toValueRecord(taskIds, true) },
      tasks: {
        ...state.tasks,
        ...Object.fromEntries(
          taskIds.map((id, i) => [id, { ...state.tasks[id], ...payload[i] }]),
        ),
      },
    }));

    try {
      const { updated } = await taskServices.updateTasks(taskIds, payload);
      if (!updated?.length) return null;
      const fresh = updated.filter(
        (t) => latestUpdateReqByTask[t.id] === reqId,
      );
      if (fresh.length) {
        set((state) => ({
          tasks: {
            ...state.tasks,
            ...Object.fromEntries(
              fresh.map((t) => [t.id, { ...state.tasks[t.id], ...t }]),
            ),
          },
        }));
      }
      return updated;
    } catch (error) {
      set((state) => ({
        tasks: {
          ...state.tasks,
          ...Object.fromEntries(
            taskIds
              .filter(
                (id) =>
                  latestUpdateReqByTask[id] === reqId && snapshotByTask[id],
              )
              .map((id) => [id, snapshotByTask[id]]),
          ),
        },
      }));
      throw error;
    } finally {
      set((state) => ({
        tasksLoader: { ...state.tasksLoader, ...toValueRecord(taskIds, false) },
      }));
    }
  },

  deleteTasks: async (taskIds) => {
    if (taskIds.length === 0) {
      toast.error('No tasks to delete');
      return;
    }
    set({ status: 'deleting' });
    try {
      const response = await taskServices.deleteTasks(taskIds);
      if (!response.deleted) {
        set({ status: 'none' });
        toast.error('Failed to delete tasks');
        return;
      }
      set((state) => {
        const newTasks = { ...state.tasks };
        taskIds.forEach((id) => delete newTasks[id]);
        return { tasks: newTasks, status: 'none' };
      });
    } catch (error) {
      set({ status: 'error' });
      throw error;
    }
  },

  fetchTasksByColumns: async (colIds, limitTasks) => {
    if (!colIds || colIds.length === 0) return [];
    set({ status: 'fetching' });
    useColumnStore.setState((state) => ({
      columnsLoader: { ...state.columnsLoader, ...toValueRecord(colIds, true) },
    }));
    try {
      // filter ปัจจุบันของบอร์ดติดไปกับทุก fetch — ผลลัพธ์+pageInfo เป็นเซ็ตที่กรองแล้ว
      const response = await taskServices.getTasksByColumns(
        colIds,
        limitTasks,
        undefined,
        useBoardFilterStore.getState().toFilterPayload(),
      );
      const tasksData = response.data;
      set((state) => ({
        tasks: { ...state.tasks, ...toRecord(tasksData, 'id') },
        taskPages: { ...state.taskPages, ...(response.pageInfo ?? {}) },
        status: 'none',
      }));
      // bulk fetch ส่ง assignees มาด้วย — hydrate เข้า assignee store ให้การ์ดใช้
      useAssigneeStore.getState().ingestMany(response.assignees ?? {});
      return tasksData;
    } catch (error) {
      set({ status: 'error' });

      throw error;
    } finally {
      set({ status: 'none' });
      useColumnStore.setState((state) => ({
        columnsLoader: {
          ...state.columnsLoader,
          ...toValueRecord(colIds, false),
        },
      }));
    }
  },

  loadMoreTasks: async (columnId) => {
    const { taskPages, loadMoreLoader } = get();
    const page = taskPages[columnId];
    if (!page?.hasMore || !page.nextCursor || loadMoreLoader[columnId]) {
      return [];
    }
    set((state) => ({
      loadMoreLoader: { ...state.loadMoreLoader, [columnId]: true },
    }));
    try {
      const response = await taskServices.getTasksByColumns(
        [columnId],
        TASK_PAGE_SIZE,
        { [columnId]: page.nextCursor },
        useBoardFilterStore.getState().toFilterPayload(),
      );
      const tasksData = response.data;
      set((state) => ({
        tasks: { ...state.tasks, ...toRecord(tasksData, 'id') },
        taskPages: { ...state.taskPages, ...(response.pageInfo ?? {}) },
      }));
      useAssigneeStore.getState().ingestMany(response.assignees ?? {});
      return tasksData;
    } finally {
      set((state) => ({
        loadMoreLoader: { ...state.loadMoreLoader, [columnId]: false },
      }));
    }
  },

  columnEndBound: (columnId) =>
    get().taskPages[columnId]?.nextCursor?.orderFraction ?? null,

  // อัปเดต task จาก realtime event (Pusher) → store อัปเดต → board re-derives อัตโนมัติ
  // task ใหม่ที่อยู่นอกหน้าต่างที่โหลดแล้วจะถูกข้าม — เดี๋ยว pagination โหลดมาเองตามลำดับ
  updateTaskFromRealtime: (task) => {
    set((state) => {
      if (
        !state.tasks[task.id] &&
        isBeyondLoadedWindow(state.taskPages, task)
      ) {
        return state;
      }
      return {
        tasks: {
          ...state.tasks,
          [task.id]: {
            ...state.tasks[task.id],
            ...task,
            timestamp: Date.now(),
          },
        },
      };
    });
  },

  addTasksFromRealtime: (tasks) => {
    if (!tasks.length) return;
    const ts = Date.now();
    set((state) => {
      const visible = tasks.filter(
        (t) => state.tasks[t.id] || !isBeyondLoadedWindow(state.taskPages, t),
      );
      if (!visible.length) return state;
      return {
        tasks: {
          ...state.tasks,
          ...Object.fromEntries(
            visible.map((t) => [
              t.id,
              { ...state.tasks[t.id], ...t, timestamp: ts },
            ]),
          ),
        },
      };
    });
  },

  removeTasksFromRealtime: (taskIds) => {
    if (!taskIds.length) return;
    set((state) => {
      const next = { ...state.tasks };
      taskIds.forEach((id) => delete next[id]);
      return { tasks: next };
    });
  },
}));
