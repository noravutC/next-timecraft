// src/hooks/store/use-board-map.store.tsx
import { create } from "zustand";
import { columnMapServices } from "@/lib/services/column-map.service";
import { taskServices } from "@/lib/services/tasks.service";
import { toast } from "sonner";
import { ColumnMapTask } from "@/types/column-map";
import { TaskCache } from "@/types/task";

export interface BoardMapStore {
    columnMap: {
        [columnId: string]: ColumnMapTask;
    };
    loadingMoreByColumnId: Record<string, boolean>;
    setColumnMap: (
        updater:
            | { [columnId: string]: ColumnMapTask }
            | ((
                  prev: { [columnId: string]: ColumnMapTask },
              ) => { [columnId: string]: ColumnMapTask }),
    ) => void;
    fetchBoardColumnMapTaskByProjectId: (
        projectId: string | null | undefined,
    ) => Promise<void>;
    fetchMoreTasksByColumnId: (
        columnId: string,
        options?: { limit?: number },
    ) => Promise<void>;

}

export const useBoardMapStore = create<BoardMapStore>((set, get) => ({
    columnMap: {},
    loadingMoreByColumnId: {},
    setColumnMap: (updater) =>
        set((state) => ({
            columnMap:
                typeof updater === "function"
                    ? updater(state.columnMap)
                    : updater,
        })),
    fetchBoardColumnMapTaskByProjectId: async (
        projectId: string | null | undefined,
    ) => {
        if (!projectId) {
            console.log("No projectId provided for fetching column map tasks.");
            return;
        };
        try {

            const response =
                await columnMapServices.fetchBoardColumnMapTaskByProjectId(
                    projectId,
                );
            const colMapTaskList = response.data ?? [];
            const newColumnMap = colMapTaskList.reduce((acc, col) => {
                acc[col._id] = col;
                return acc;
            }, {} as { [key: string]: ColumnMapTask })
            set((state) => ({
                columnMap: {
                    ...state.columnMap,
                    ...newColumnMap,
                },
            }))
            console.log("Fetched column map tasks:", response);
        } catch (error) {
            console.error("Error fetching board columns:", error);
            toast.error("An unexpected error occurred.");
        }
    },
    fetchMoreTasksByColumnId: async (columnId, options) => {
        if (!columnId) {
            return;
        }
        const existingColumn = get().columnMap[columnId];
        if (!existingColumn) {
            return;
        }
        const isLoading = get().loadingMoreByColumnId[columnId];
        if (isLoading) {
            return;
        }
        const existingTasks = existingColumn.taskInColumn ?? {};
        const loadedCount = Object.keys(existingTasks).length;
        if (existingColumn.totalTasks <= loadedCount) {
            return;
        }
        const limit = options?.limit ?? 20;
        try {
            set((state) => ({
                loadingMoreByColumnId: {
                    ...state.loadingMoreByColumnId,
                    [columnId]: true,
                },
            }));
            const response = await taskServices.getTasksByColumnId(columnId, {
                skip: loadedCount,
                limit,
                archived: false,
            });
            const tasks = response?.data ?? [];
            if (tasks.length === 0) {
                return;
            }
            set((state) => {
                const column = state.columnMap[columnId];
                if (!column) {
                    return state;
                }
                const nextTaskInColumn: Record<string, TaskCache> = {
                    ...(column.taskInColumn ?? {}),
                };
                tasks.forEach((task) => {
                    const taskId = task._id?.toString() ?? "";
                    if (!taskId) {
                        return;
                    }
                    nextTaskInColumn[taskId] = {
                        ...task,
                        _id: taskId,
                        columnId: task.columnId?.toString() ?? columnId,
                        projectId: task.projectId?.toString() ?? column.projectId,
                        timestamp: Date.now(),
                    };
                });
                return {
                    columnMap: {
                        ...state.columnMap,
                        [columnId]: {
                            ...column,
                            taskInColumn: nextTaskInColumn,
                        },
                    },
                };
            });
        } catch (error) {
            console.error("Error fetching more tasks:", error);
            toast.error("Failed to load more tasks.");
        } finally {
            set((state) => ({
                loadingMoreByColumnId: {
                    ...state.loadingMoreByColumnId,
                    [columnId]: false,
                },
            }));
        }
    },
}));
