// src/hooks/store/use-board-map.store.tsx
import { create } from "zustand";
import { columnMapServices } from "@/lib/services/column-map.service";
import { LoaderStatus } from "../hook.type";
import { toast } from "sonner";
import { ColumnMapTask } from "@/types/column-map";

export interface BoardMapStore {
    columnMap: {
        [columnId: string]: ColumnMapTask;
    };
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

}

export const useBoardMapStore = create<BoardMapStore>((set, get) => ({
    columnMap: {},
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
}));
