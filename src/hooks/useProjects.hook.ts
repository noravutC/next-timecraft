// src/hooks/useProjects.ts
import { create } from "zustand";
import { Project } from "@/types";
import { projectServices } from "@/lib/services/projects.service";
import { LoaderStatus } from "./hook.type";

interface ProjectStore {
  projects: Record<string, Project>;

  status: LoaderStatus;
  setStatus: (status: LoaderStatus) => void;

  // set
  setProject: (projectId: string, projectData: Project) => void;
  setProjects: (projects: Project[]) => void;
  clearProjects: () => void;

  // get
  getProjectById: (projectId: string) => Project | undefined;

  // fetch
  fetchProjects: () => Promise<Project[]>;
  fetchProjectById: (projectId: string) => void;
  // actions
  createProject: (data: Partial<Project>) => void;
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
    }, {} as Record<string, Project>);
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
    } catch (error) {
      console.error("Failed to fetch project by ID:", error);
      throw error;
    } finally {
      set({ status: "none" });
    }
  },
  createProject: async (data: Partial<Project>) => {
    try {
      set({ status: "creating" });
      const response = await projectServices.createProject(data);
      const project = response.created;

      if (project) {
        get().setProject(project._id, project);
        return project;
      }
    } catch (error) {
      console.error("Failed to create project:", error);
      throw error;
    } finally {
      set({ status: "none" });
    }
  },
}));
