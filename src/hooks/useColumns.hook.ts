// src/hooks/useColumns.hook.ts
import { create } from "zustand";
import { Column } from "@/types";
import { columnServices } from "@/lib/services/columns.service";
import { LoaderStatus } from "./hook.type";

interface ColumnStore {
  columns: Record<string, Column>;

  status: LoaderStatus;
  setStatus: (status: LoaderStatus) => void;

  // set
  setColumn: (columnId: string, columnData: Column) => void;
  setColumns: (columns: Column[]) => void;
  clearColumns: () => void;

  // get
  getColumnById: (columnId: string) => Column | undefined;
  getColumnsByProjectId: (projectId: string | null | undefined) => Column[];

  // fetch
  fetchColumnsByProjectId: (
    projectId: string | null | undefined
  ) => Promise<Column[]>;
  // actions
  createColumn: (projectId: string, columnData: Partial<Column>) => Promise<Column | null>;
}

export const useColumnStore = create<ColumnStore>((set, get) => ({
  columns: {},
  status: "none",

  setStatus: (status) => set({ status }),

  setColumn: (columnId, columnData) => {
    if (columnId !== columnData._id) {
      console.warn(`Column ID mismatch: ${columnId} !== ${columnData._id}`);
    }
    set((state) => ({
      columns: {
        ...state.columns,
        [columnId]: columnData,
      },
    }));
  },

  setColumns: (columns) => {
    const mapped = columns.reduce((acc, column) => {
      acc[column._id] = column;
      return acc;
    }, {} as Record<string, Column>);
    set((state) => ({
      columns: {
        ...state.columns,
        ...mapped,
      },
    }));
  },

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

  fetchColumnsByProjectId: async (projectId: string | null | undefined) => {
    try {
      set({ status: "fetching" });
      const response = await columnServices.getColumnsByProjectId(
        projectId ?? ""
      );
      const columns = response?.data || [];

      if (columns.length > 0) {
        get().setColumns(columns);
      }

      return columns;
    } catch (error) {
      console.log("Failed to fetch column by project id:", error);
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
        columnData,
      );
      const column = response?.created;

      if (column) {
        get().setColumn(column._id, column);
      }

      return column;
    } catch (error) {
      console.log("Failed to create column:", error);
      throw error;
    } finally {
      set({ status: "none" });
    }
  },
}));
