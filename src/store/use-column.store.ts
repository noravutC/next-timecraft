import { create } from "zustand";
import { CreateColumnPayload, ColumnCache, UpdateColumnPayload } from "@/types";
import { LoaderStatus } from "@/types/global/types";
import { columnServices } from "@/services/columns.service";
import { toRecord } from "@/helper/utils/object";
import { toast } from "sonner";

type ColumnStore = {
  status: LoaderStatus;
  columns: {
    [columnId: string]: ColumnCache;
  };
  columnsLoader: {
    [columnId: string]: boolean;
  };
  createColumns: (
    payload: CreateColumnPayload[],
  ) => Promise<ColumnCache[] | null>;
  updateColumns: (
    colIds: string[],
    payload: UpdateColumnPayload[],
  ) => Promise<ColumnCache[] | null>;
  deleteColumns: (colIds: string[]) => Promise<void>;
  /** optimistic: rename, recolor, WIP limit or move one column */
  patchColumn: (
    columnId: string,
    patch: Omit<UpdateColumnPayload, "id">,
  ) => Promise<void>;
  /** brings deleted columns back into the board */
  restoreColumns: (colIds: string[]) => Promise<ColumnCache[]>;
  fetchColumns: (
    projectId: string,
    limitTasks?: number,
  ) => Promise<ColumnCache[]>;
};

export const useColumnStore = create<ColumnStore>((set, get) => ({
  status: "none",
  columns: {},
  columnsLoader: {},
  createColumns: async (payload) => {
    if (payload.length === 0) {
      toast.error("No columns to create");
      return null;
    }
    set({ status: "creating" });
    try {
      const response = await columnServices.createColumns(payload);
      const createdColumns = response.created;

      if (!createdColumns || createdColumns.length === 0) {
        set({ status: "none" });
        return null;
      }

      const columnsMap = toRecord(createdColumns, "id");
      set((state) => ({
        columns: {
          ...state.columns,
          ...columnsMap,
        },
        status: "none",
      }));

      return createdColumns;
    } catch (error) {
      set({ status: "error" });
      throw error;
    }
  },
  updateColumns: async (colIds, payload) => {
    if (colIds.length === 0 || payload.length === 0) {
      toast.error("No columns to update");
      return null;
    }
    set({ status: "updating" });
    colIds.forEach((columnId) => {
      set((state) => ({
        columnsLoader: { ...state.columnsLoader, [columnId]: true },
      }));
    });
    try {
      const response = await columnServices.updateColumns(colIds, payload);
      const updatedColumns = response.updated;

      if (!updatedColumns || updatedColumns.length === 0) {
        set({ status: "none" });
        return null;
      }

      const columnsMap = toRecord(updatedColumns, "id");
      set((state) => ({
        columns: {
          ...state.columns,
          ...columnsMap,
        },
        status: "none",
      }));

      return updatedColumns;
    } catch (error) {
      set({ status: "error" });
      colIds.forEach((columnId) => {
        set((state) => ({
          columnsLoader: { ...state.columnsLoader, [columnId]: false },
        }));
      });
      throw error;
    } finally {
      set({ status: "none" });
      colIds.forEach((columnId) => {
        set((state) => ({
          columnsLoader: { ...state.columnsLoader, [columnId]: false },
        }));
      });
    }
  },
  deleteColumns: async (colIds) => {
    if (colIds.length === 0) {
      toast.error("No columns to delete");
      return;
    }
    set({ status: "deleting" });
    try {
      const response = await columnServices.deleteColumns(colIds);
      const isDeleted = response.deleted;
      if (!isDeleted) {
        set({ status: "none" });
        toast.error("Failed to delete columns");
        return;
      }
      set((state) => {
        const newColumns = { ...state.columns };
        colIds.forEach((id) => delete newColumns[id]);
        return {
          columns: newColumns,
          status: "none",
        };
      });
    } catch (error) {
      set({ status: "error" });
      throw error;
    }
  },
  patchColumn: async (columnId, patch) => {
    const snapshot = get().columns[columnId];
    if (!snapshot) return;
    set((state) => ({
      columns: { ...state.columns, [columnId]: { ...snapshot, ...patch } },
    }));
    try {
      await columnServices.updateColumns([columnId], [{ id: columnId, ...patch }]);
    } catch (error) {
      set((state) => ({ columns: { ...state.columns, [columnId]: snapshot } }));
      throw error;
    }
  },
  restoreColumns: async (colIds) => {
    const { updated } = await columnServices.restoreColumns(colIds);
    const restored = (updated ?? []).map((c) => ({ ...c, timestamp: Date.now() }));
    set((state) => ({
      columns: { ...state.columns, ...toRecord(restored, "id") },
    }));
    return restored;
  },
  fetchColumns: async (projectId, limitTasks = 50) => {
    if (!projectId) {
      return [];
    }

    set({ status: "fetching" });
    try {
      const response = await columnServices.getColumnsByProjectId(
        projectId,
        limitTasks,
      );
      const columnsData = response.data;
      const columnsMap = toRecord(columnsData, "id");
      set((state) => ({
        columns: {
          ...state.columns,
          ...columnsMap,
        },
        status: "none",
      }));
      return columnsData;
    } catch (error) {
      set({ status: "error" });
      throw error;
    }
  },
}));
