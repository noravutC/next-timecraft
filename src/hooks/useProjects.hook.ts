// src/hooks/useProjects.ts
import { create } from "zustand";
import { Project, ProjectCache } from "@/types";
import { projectServices } from "@/lib/services/projects.service";
import { LoaderStatus } from "./hook.type";
import { toast } from "sonner";

interface ProjectStore {
  lastFetched: number;
  projects: {
    [projectId: string]: ProjectCache;
  };
  projectIdActivate?: string | null | undefined;

  status: LoaderStatus;
  setStatus: (status: LoaderStatus) => void;

  // set
  setActivateProject: (projectId: string | undefined | null) => void;
  clearProjects: () => void;

  // get
  getProjectById: (projectId: string) => ProjectCache | undefined;

  // fetch
  fetchProjects: (isBackground?: boolean) => Promise<Project[]>;
  fetchProjectById: (projectId: string) => void;
  // actions
  createProject: (data: Partial<Project>) => void;
  updateProject: (projectId: string, data: Partial<Project>) => void;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  lastFetched: 0,
  projects: {},
  status: "none",
  projectIdActivate: null,

  setStatus: (status) => set({ status }),
  setActivateProject: (projectId: string | undefined | null) =>
    set({ projectIdActivate: projectId }),

  clearProjects: () => set({ projects: {} }),

  getProjectById: (projectId: string) => {
    return get().projects[projectId];
  },

  fetchProjects: async (isBackground = false) => {
    const { lastFetched, projects } = get();
    const now = Date.now();
    const cacheDuration = 2 * 60 * 1000; //2 minute

    if (Object.keys(projects).length > 0 && now - lastFetched < cacheDuration) {
      console.log("Using cached projects data.");
      return Object.values(projects) as Project[];
    }

    try {
      if (!isBackground) {
        set({ status: "fetching" });
      }
      const response = await projectServices.getProjects();
      const fetchedProjects = response?.data || [];
      const projectIdActivate = get().projectIdActivate;

      const mappedProjects = fetchedProjects.reduce((acc, project) => {
        acc[project._id] = { ...project, timestamp: now } as ProjectCache;
        return acc;
      }, {} as Record<string, ProjectCache>);

      set(() => ({
        projects: mappedProjects,
        lastFetched: now,
        projectIdActivate:
          projectIdActivate && mappedProjects[projectIdActivate]
            ? projectIdActivate
            : fetchedProjects[0]?._id || null,
      }));

      return fetchedProjects;
    } catch (error) {
      console.log("Failed to fetch projects:", error);
      throw error;
    } finally {
      set({ status: "none" });
    }
  },

  fetchProjectById: async (projectId: string) => {
    const { projects } = get();
    const now = Date.now();
    const cacheDuration = 2 * 60 * 1000;
    const projectCache = projects[projectId];
    if (projectCache && now - projectCache.timestamp < cacheDuration) {
      console.log("Use project cache");
      return;
    }
    try {
      set({ status: "fetching" });
      const response = await projectServices.getProjectById(projectId);
      const project = response.data;

      if (project) {
        // get().setProject(project._id, project); // ✅ ใช้ method กลาง
        return project;
      }
    } catch (error) {
      console.log("Failed to fetch project by ID:", error);
      throw error;
    } finally {
      set({ status: "none" });
    }
  },

  // actions
  createProject: async (data: Partial<Project>) => {
    try {
      set({ status: "creating" });
      const response = await projectServices.createProject(data);
      const newProject = response.created;

      if (newProject) {
        set((state) => ({
          projects: {
            ...state.projects,
            [newProject._id]: { ...newProject, timestamp: Date.now() },
          },
          projectIdActivate: newProject._id,
        }));
      }
    } catch (error) {
      console.log("Failed to create project:", error);
      throw error;
    } finally {
      set({ status: "none" });
    }
  },
  updateProject: async (projectId: string, data: Partial<Project>) => {
    const project = get().getProjectById(projectId);
    if (!project) {
      toast.error("Project is required to update a project.");
      return;
    }
    try {
      set({ status: "updating" });
      const response = await projectServices.updateProject(projectId, data);
      const updatedProject = response.updated;

      if (updatedProject) {
        set((state) => ({
          projects: {
            ...state.projects,
            [updatedProject._id]: { ...project, ...updatedProject, timestamp: Date.now() },
          },
          projectIdActivate: updatedProject._id,
        }));
      }
    } catch (error) {
      console.log("Failed to update project:", error);
      throw error;
    } finally {
      set({ status: "none" });
    }
  },
}));
