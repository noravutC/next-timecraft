// src/hooks/useTemplateColumn.hook.ts
import { create } from "zustand";
import { TemplateColumn } from "@/types";
import { templateColumnsServices } from "@/lib/services/template-columns.service";
import { LoaderStatus } from "./hook.type";

interface TemplateColumnStore {
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
}

export const useTemplateColumnsStore = create<TemplateColumnStore>(
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
        set({ status: "fetching" });
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
        set({ status: "none" });
      }
    },

    // actions
  })
);
