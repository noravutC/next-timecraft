import { create } from "zustand";
import { InvitableRole, Member, ProjectCache } from "@/types";
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
  /** open `preferredId` (a board from the URL) when the user can see it;
   *  otherwise keep the open board, and fall back to the first one only when
   *  none is open or the open one is gone */
  ensureActiveProject: (preferredId?: string | null) => void;
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
  removeMember: (projectId: string, memberUserId: string) => Promise<void>;
  /** optimistic: the row shows the new role at once */
  changeMemberRole: (
    projectId: string,
    memberUserId: string,
    role: InvitableRole,
  ) => Promise<void>;
  /** drops the board from your list once the server agrees */
  leaveProject: (projectId: string) => Promise<void>;
  transferOwnership: (
    projectId: string,
    fromUserId: string,
    toUserId: string,
  ) => Promise<void>;
  fetchProjects: (
    projectIds: string[],
    fetchAll?: boolean,
  ) => Promise<ProjectCache[]>;
  viewProjectUsing: () => ProjectCache | null;
};

// the board to show when the current one goes away: an active one first,
// since an archived board only opens when asked for by name
const firstBoardId = (projects: Record<string, ProjectCache>) => {
  const all = Object.values(projects);
  return (all.find((p) => !p.archived) ?? all[0])?.id ?? null;
};

export const useProjectStore = create<ProjectStore>((set, get) => ({
  status: "none",
  projectIsUsing: null,
  needCreateProject: false,
  projects: {},
  setProjectIsUsing: (projectId) => {
    set({ projectIsUsing: projectId });
  },
  ensureActiveProject: (preferredId) => {
    const { projectIsUsing, projects } = get();
    if (preferredId && projects[preferredId]) {
      if (projectIsUsing !== preferredId) set({ projectIsUsing: preferredId });
      return;
    }
    if (projectIsUsing && projects[projectIsUsing]) return;
    const first = firstBoardId(projects);
    if (first) set({ projectIsUsing: first });
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
          ? firstBoardId(rest)
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
            ? firstBoardId(rest)
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
  // pessimistic — ให้ server ยืนยันก่อนค่อยเอาออกจาก state (delete op)
  removeMember: async (projectId, memberUserId) => {
    set({ status: "deleting" });
    try {
      await projectServices.removeMember(projectId, memberUserId);
      set((state) => {
        const project = state.projects[projectId];
        if (!project) return { status: "none" as const };
        return {
          projects: {
            ...state.projects,
            [projectId]: {
              ...project,
              members: project.members.filter(
                (m) => m.userId !== memberUserId,
              ),
              timestamp: Date.now(),
            },
          },
          status: "none" as const,
        };
      });
    } catch (error) {
      set({ status: "error" });
      throw error;
    }
  },
  changeMemberRole: async (projectId, memberUserId, role) => {
    const snapshot = get().projects[projectId];
    if (!snapshot) return;
    const withRoles = (roleOf: (m: Member) => Member['role']) =>
      set((state) => ({
        projects: {
          ...state.projects,
          [projectId]: {
            ...snapshot,
            members: snapshot.members.map((m) => ({ ...m, role: roleOf(m) })),
            timestamp: Date.now(),
          },
        },
      }));
    withRoles((m) => (m.userId === memberUserId ? role : m.role));
    try {
      await projectServices.changeMemberRole(projectId, memberUserId, role);
    } catch (error) {
      withRoles((m) => m.role);
      throw error;
    }
  },
  leaveProject: async (projectId) => {
    await projectServices.leaveBoard(projectId);
    get().removeProject(projectId);
  },
  transferOwnership: async (projectId, fromUserId, toUserId) => {
    await projectServices.transferOwnership(projectId, toUserId);
    set((state) => {
      const project = state.projects[projectId];
      if (!project) return state;
      return {
        projects: {
          ...state.projects,
          [projectId]: {
            ...project,
            ownerId: toUserId,
            members: project.members.map((m) =>
              m.userId === toUserId
                ? { ...m, role: 'owner' as const }
                : m.userId === fromUserId
                  ? { ...m, role: 'admin' as const }
                  : m,
            ),
            timestamp: Date.now(),
          },
        },
      };
    });
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
