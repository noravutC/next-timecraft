// src/hooks/useTemplateColumn.hook.ts
import { create } from "zustand";
import { Column, ColumnCache, CombineColumnTask, TemplateColumn } from "@/types";
import { templateColumnsServices } from "@/lib/services/template-columns.service";
import { LoaderStatus } from "./hook.type";
import { useBoardStore } from "./useBoard.hook";
import { toRecord } from "@/helper/utils/object";
import { useProjectStore } from "./useProjects.hook";

interface TemplateBoardStore {
  templateColumns: Record<string, TemplateColumn>;

  status: LoaderStatus;
  setStatus: (status: LoaderStatus) => void;

  // set
  setTemplateColumn: (templateId: string, templateData: TemplateColumn) => void;
  setTemplateColumns: (templates: TemplateColumn[]) => void;
  clearTemplateColumns: () => void;

  // get
  getTemplateColumnById: (Id: string) => TemplateColumn | undefined;

  // fetch
  fetchTemplateColumns: () => Promise<TemplateColumn[]>;

  // actions
  applyBoardTemplateIntoProject: (
    projectIdOrParams: string | { projectId?: string; projectName?: string; template: TemplateColumn },
    templateArg?: TemplateColumn
  ) => Promise<void>;
}

export const useTemplateColumnsStore = create<TemplateBoardStore>(
  (set, get) => ({
    templateColumns: {},
    status: "none",

    // set
    setStatus: (status) => set({ status }),
    setTemplateColumn: (templateId: string, templateData: TemplateColumn) => {
      if (templateId !== templateData._id) {
        console.log(
          `TemplateColumn ID mismatch: ${templateId} !== ${templateData._id}`
        );
      }
      set((state) => ({
        templateColumns: {
          ...state.templateColumns,
          [templateId]: templateData,
        },
      }));
    },
    setTemplateColumns: (templates: TemplateColumn[]) => {
      const mapped = templates.reduce((acc, template) => {
        acc[template._id] = template;
        return acc;
      }, {} as Record<string, TemplateColumn>);
      set((state) => ({
        templateColumns: {
          ...state.templateColumns,
          ...mapped,
        },
      }));
    },
    clearTemplateColumns: () => set({ templateColumns: {} }),

    // get
    getTemplateColumnById: (Id: string) => {
      return get().templateColumns[Id];
    },

    // fetch
    fetchTemplateColumns: async () => {
      try {
        if (get().status !== "updating") {
          set({ status: "fetching" });
        }
        const response = await templateColumnsServices.getTemplateColumns();
        const templateColumns = response?.data || [];

        if (templateColumns.length > 0) {
          get().setTemplateColumns(templateColumns);
        }

        return templateColumns;
      } catch (error) {
        console.log("Failed to fetch template columns:", error);
        throw error;
      } finally {
        if (get().status === "fetching") {
          set({ status: "none" });
        }
      }
    },

    // actions
    applyBoardTemplateIntoProject: async (
      projectIdOrParams: string | { projectId?: string; projectName?: string; template: TemplateColumn },
      templateArg?: TemplateColumn
    ) => {
      set({ status: "updating" });
      try {
        const response =
          await templateColumnsServices.applyTemplateColumnsToProject(
            projectIdOrParams,
            templateArg
          );
        const updatedColumns = response?.updated?.columns ?? [];
        const projectId = response?.updated?.projectId;
        // const updatedColumns: Column[] | null = [];
        if (updatedColumns && updatedColumns.length > 0) {
          const now = Date.now();
          const colsCache: ColumnCache[] = updatedColumns.map((c) => ({ ...c, timestamp: now }))
          const colCombined: CombineColumnTask[] = updatedColumns.map((c) => ({ ...c, tasks: [] }));
          const columnsMap = toRecord(colsCache, '_id');
          const combineColumnMap = toRecord(colCombined, '_id');
          useBoardStore.setState((state) => ({
            columns: {
              ...state.columns,
              ...columnsMap,
            },
            columnCombineTasks: {
              ...state.columnCombineTasks,
              ...combineColumnMap,
            }
          }));
          if (projectId) {
            useProjectStore.getState().setActivateProject(projectId);
            useProjectStore.getState().fetchProjectById(projectId);
          }
        }
      } catch (error) {
        console.log("Failed to apply board into project:", error);
        throw error;
      } finally {
        if (get().status === "updating") {
          set({ status: "none" });
        }
      }
    },
  })
);
