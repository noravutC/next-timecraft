import { create } from "zustand";
import { CreateColumnPayload, ColumnCache, UpdateColumnPayload } from "@/types";
import { LoaderStatus } from "@/hooks/hook.type";
import { columnServices } from "@/services/columns.service";
import { toRecord } from "@/helper/utils/object";
import { toast } from "sonner";

type ColumnStore = {
  status: LoaderStatus;
  columns: {
    [columnId: string]: ColumnCache;
  };
  createColumns: (payload: CreateColumnPayload[]) => Promise<ColumnCache[] | null>;
  updateColumns: (colIds: string[], payload: UpdateColumnPayload[]) => Promise<ColumnCache[] | null>;
  deleteColumns: (colIds: string[]) => Promise<void>;
  fetchColumns: (
    projectId: string,
    limitTasks?: number,
  ) => Promise<ColumnCache[]>;
};

export const useColumnStore = create<ColumnStore>((set) => ({
  status: "none",
  columns: {},
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
      throw error;
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
  fetchColumns: async (projectId, limitTasks = 50) => {
    if (!projectId) {
      return [];
    }

    set({ status: "fetching" });
    try {
      const response = await columnServices.getColumnsByProjectId(projectId, limitTasks);
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
