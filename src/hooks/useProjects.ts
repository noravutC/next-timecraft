// src/hooks/useProjects.ts
import { create } from "zustand";
import { CreateTask, Projects } from "@/src/types";
import { projectServices } from "@/src/lib/services/projects.service";

type ProjectStatus = "none" | "fetching" | "creating" | "updating" | "deleting";

interface ProjectStore {
  projects: Record<string, Projects>;

  status: ProjectStatus;
  setStatus: (status: ProjectStatus) => void;

  // set
  setProject: (projectId: string, projectData: Projects) => void;
  setProjects: (projects: Projects[]) => void;
  clearProjects: () => void;

  // get
  getProjectById: (projectId: string) => Projects | undefined;

  // fetch
  fetchProjects: () => Promise<Projects[]>;
  fetchProjectById: (projectId: string) => Promise<Projects | null>;
  // actions
  createTaskByProjectId: (projectId: string, task: CreateTask) => Promise<Projects>;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: {},
  status: "none",

  setStatus: (status) => set({ status }),

  setProject: (projectId, projectData) => {
    if (projectId !== projectData._id) {
      console.warn(`Project ID mismatch: ${projectId} !== ${projectData._id}`);
    }
    set((state) => ({
      projects: {
        ...state.projects,
        [projectId]: projectData,
      },
    }));
  },

  setProjects: (projects) => {
    const mapped = projects.reduce((acc, project) => {
      acc[project._id] = project;
      return acc;
    }, {} as Record<string, Projects>);
    set((state) => ({
      projects: {
        ...state.projects,
        ...mapped,
      },
    }));
  },

  clearProjects: () => set({ projects: {} }),

  getProjectById: (projectId: string) => {
    return get().projects[projectId];
  },

  fetchProjects: async () => {
    try {
      set({ status: "fetching" });
      const response = await projectServices.getProjects();
      const projects = response?.data || [];

      if (projects.length > 0) {
        get().setProjects(projects);
      }

      return projects;
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      throw error;
    } finally {
      set({ status: "none" });
    }
  },

  fetchProjectById: async (projectId: string) => {
    try {
      set({ status: "fetching" });
      const response = await projectServices.getProjectById(projectId);
      const project = response.data;

      if (project) {
        get().setProject(project._id, project); // ✅ ใช้ method กลาง
        return project;
      }

      return null;
    } catch (error) {
      console.error("Failed to fetch project by ID:", error);
      throw error;
    } finally {
      set({ status: "none" });
    }
  },
  createTaskByProjectId: async (projectId: string, task: CreateTask) => {
    try {
      set({ status: "creating" });
      const response = await projectServices.insertTaskByProjectId(projectId, task);

      const updatedColumn  = response.updated;
      if (updatedColumn) {
      const project = get().projects[projectId];
      const updatedColumns = project.columns.map((col) =>
        col.column_id === updatedColumn.column_id ? updatedColumn : col
      );

      const updatedProject = {
        ...project,
        columns: updatedColumns,
      };

      get().setProject(projectId, updatedProject);
      return updatedProject;
    }
      // if (updatedProject) {
      //   get().setProject(updatedProject._id, updatedProject);
      //   return updatedProject;
      // }

      throw new Error("Failed to create task");
    } catch (error) {
      console.log("Failed to create task:", error);
      throw error;
    } finally {
      set({ status: "none" });
    }
  },
}));
