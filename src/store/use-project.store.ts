import { create } from "zustand";
import { ProjectCache } from "@/types";
import { LoaderStatus } from "@/hooks/hook.type";
import { CreateProjectPayload, projectServices } from "@/services/projects.service";
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
  createProject: (payload: CreateProjectPayload) => Promise<ProjectCache | null>;
  fetchProjects: (
    projectIds: string[],
    fetchAll?: boolean,
  ) => Promise<ProjectCache[]>;
};

export const useProjectStore = create<ProjectStore>((set) => ({
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
}));
