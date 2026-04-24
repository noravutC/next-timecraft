import { create } from "zustand";
import { ProjectCache } from "@/types";
import { LoaderStatus } from "@/types/global/types";
import {
  CreateProjectPayload,
  UpdateProjectPayload,
  projectServices,
} from "@/services/projects.service";
import { toRecord } from "@/helper/utils/object";

type ProjectStore = {
  status: LoaderStatus;
  projectIsUsing: string | null;
  needCreateProject: boolean;
  projects: {
    [projectId: string]: ProjectCache;
  };
  setProjectIsUsing: (projectId: string | null) => void;
  setNeedCreateProject: (needCreateProject: boolean) => void;
  createProject: (
    payload: CreateProjectPayload,
  ) => Promise<ProjectCache | null>;
  updateProject: (
    projectId: string,
    payload: UpdateProjectPayload,
  ) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  removeProject: (projectId: string) => void;
  fetchProjects: (
    projectIds: string[],
    fetchAll?: boolean,
  ) => Promise<ProjectCache[]>;
  viewProjectUsing: () => ProjectCache | null;
};

export const useProjectStore = create<ProjectStore>((set, get) => ({
  status: "none",
  projectIsUsing: null,
  needCreateProject: false,
  projects: {},
  setProjectIsUsing: (projectId) => {
    set({ projectIsUsing: projectId });
  },
  setNeedCreateProject: (needCreateProject) => {
    set({ needCreateProject });
  },
  createProject: async (payload) => {
    set({ status: "creating" });
    try {
      const response = await projectServices.createProject(payload);
      const createdProject = response.created;

      if (!createdProject) {
        set({ status: "none" });
        return null;
      }

      const normalizedProject: ProjectCache = {
        ...createdProject,
        members: createdProject.members ?? [],
        timestamp: Date.now(),
      };

      set((state) => ({
        projects: {
          ...state.projects,
          [normalizedProject.id]: normalizedProject,
        },
        projectIsUsing: normalizedProject.id,
        status: "none",
      }));
      set({ needCreateProject: false });

      return normalizedProject;
    } catch (error) {
      set({ status: "error" });
      throw error;
    }
  },
  updateProject: async (projectId, payload) => {
    set({ status: "updating" });
    try {
      const response = await projectServices.updateProject(projectId, payload);
      const updated = response.updated;
      if (!updated) {
        set({ status: "none" });
        return;
      }
      set((state) => ({
        projects: {
          ...state.projects,
          [projectId]: {
            ...state.projects[projectId],
            ...updated,
            timestamp: Date.now(),
          },
        },
        status: "none",
      }));
    } catch (error) {
      set({ status: "error" });
      throw error;
    }
  },
  removeProject: (projectId) => {
    set((state) => {
      const { [projectId]: _, ...rest } = state.projects;
      const nextUsing =
        state.projectIsUsing === projectId
          ? (Object.keys(rest)[0] ?? null)
          : state.projectIsUsing;
      return {
        projects: rest,
        projectIsUsing: nextUsing,
        needCreateProject: Object.keys(rest).length === 0,
      };
    });
  },
  deleteProject: async (projectId) => {
    set({ status: "deleting" });
    try {
      await projectServices.deleteProject(projectId);
      set((state) => {
        const { [projectId]: _, ...rest } = state.projects;
        const nextUsing =
          state.projectIsUsing === projectId
            ? (Object.keys(rest)[0] ?? null)
            : state.projectIsUsing;
        return {
          projects: rest,
          projectIsUsing: nextUsing,
          needCreateProject: Object.keys(rest).length === 0,
          status: "none",
        };
      });
    } catch (error) {
      set({ status: "error" });
      throw error;
    }
  },
  fetchProjects: async (projectIds, fetchAll = false) => {
    if (projectIds.length === 0 && !fetchAll) {
      return [];
    }

    set({ status: "fetching" });
    try {
      const response = await projectServices.getProjects(projectIds, fetchAll);
      const projectsData = response.data;
      const projectsMap = toRecord(projectsData, "id");
      set((state) => ({
        projects: {
          ...state.projects,
          ...projectsMap,
        },
        status: "none",
      }));
      set({ needCreateProject: projectsData.length === 0 });
      return projectsData;
    } catch (error) {
      set({ status: "error" });
      throw error;
    }
  },
  viewProjectUsing: () => {
    const { projects, projectIsUsing } = get();
    if (!projectIsUsing) return null;
    return projects[projectIsUsing] ?? null;
  },
}));
