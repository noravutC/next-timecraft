// src/services/project.service.ts
import apiClient from "@/lib/axios";
import {
  APIDelete,
  APIGet,
  APIPatch,
  APIPost,
  APISingleGet,
  InvitableRole,
  InvitationPreview,
  InviteMemberPayload,
  Member,
  PendingInvitation,
  ProjectCache,
  ProjectRow,
} from "@/types";
import type { ProjectSettings } from "@/types/project-settings";

export type ProjectTemplateColumnInput = {
  name: string;
  color?: string;
  wipLimit?: number;
  order?: number;
};

export type CreateProjectPayload = {
  name: string;
  description?: string;
  coverImage?: string | null;
  // templateColumns?: ProjectTemplateColumnInput[];
};

export type UpdateProjectPayload = {
  name?: string;
  description?: string;
  coverImage?: string | null;
  tags?: string[];
  archived?: boolean;
  settings?: ProjectSettings;
};

class ProjectService {
  private client = apiClient;

  async getProjects(
    projectIds: string[],
    fetchAll: boolean = false,
  ): Promise<APIGet<ProjectCache>> {
    return this.client
      .post("/project", { projectIds: projectIds.join(","), fetchAll })
      .then((response) => response.data as APIGet<ProjectCache>)
      .catch((error) => {
        throw error?.response?.data || new Error("Failed to fetch projects");
      });
  }

  async updateProject(
    projectId: string,
    payload: UpdateProjectPayload,
  ): Promise<APIPatch<ProjectRow>> {
    return this.client
      .patch(`/project/${projectId}`, payload)
      .then((response) => response.data as APIPatch<ProjectRow>)
      .catch((error) => {
        throw error?.response?.data || new Error("Failed to update project");
      });
  }

  async deleteProject(projectId: string): Promise<APIDelete<ProjectRow>> {
    return this.client
      .delete(`/project/${projectId}`)
      .then((response) => response.data as APIDelete<ProjectRow>)
      .catch((error) => {
        throw error?.response?.data || new Error("Failed to delete project");
      });
  }

  async inviteMember(
    projectId: string,
    payload: InviteMemberPayload,
  ): Promise<APIPost<PendingInvitation>> {
    return this.client
      .post(`/project/${projectId}/invitations`, payload)
      .then((response) => response.data as APIPost<PendingInvitation>)
      .catch((error) => {
        throw error?.response?.data || new Error("Failed to invite member");
      });
  }

  async getInvitations(projectId: string): Promise<APIGet<PendingInvitation>> {
    return this.client
      .get(`/project/${projectId}/invitations`)
      .then((response) => response.data as APIGet<PendingInvitation>)
      .catch((error) => {
        throw error?.response?.data || new Error("Failed to fetch invitations");
      });
  }

  async getInvitation(token: string): Promise<APISingleGet<InvitationPreview>> {
    return this.client
      .get(`/invite/${token}`)
      .then((response) => response.data as APISingleGet<InvitationPreview>)
      .catch((error) => {
        throw error?.response?.data || new Error("Failed to fetch invitation");
      });
  }

  async acceptInvitation(
    token: string,
  ): Promise<APIPost<{ projectId: string }>> {
    return this.client
      .post(`/invite/${token}`)
      .then((response) => response.data as APIPost<{ projectId: string }>)
      .catch((error) => {
        throw error?.response?.data || new Error("Failed to accept invitation");
      });
  }

  async removeMember(
    projectId: string,
    memberUserId: string,
  ): Promise<APIDelete<Member>> {
    return this.client
      .delete(`/project/${projectId}/members/${memberUserId}`)
      .then((response) => response.data as APIDelete<Member>)
      .catch((error) => {
        throw error?.response?.data || new Error("Failed to remove member");
      });
  }

  async changeMemberRole(
    projectId: string,
    memberUserId: string,
    role: InvitableRole,
  ): Promise<APIPatch<Member>> {
    return this.client
      .patch(`/project/${projectId}/members/${memberUserId}`, { role })
      .then((response) => response.data as APIPatch<Member>)
      .catch((error) => {
        throw error?.response?.data || new Error("Failed to change role");
      });
  }

  async leaveBoard(projectId: string): Promise<APIDelete<{ projectId: string }>> {
    return this.client
      .post(`/project/${projectId}/leave`)
      .then((response) => response.data as APIDelete<{ projectId: string }>)
      .catch((error) => {
        throw error?.response?.data || new Error("Failed to leave the board");
      });
  }

  async transferOwnership(
    projectId: string,
    userId: string,
  ): Promise<APIPatch<{ projectId: string; ownerId: string }>> {
    return this.client
      .post(`/project/${projectId}/transfer`, { userId })
      .then(
        (response) =>
          response.data as APIPatch<{ projectId: string; ownerId: string }>,
      )
      .catch((error) => {
        throw error?.response?.data || new Error("Failed to transfer the board");
      });
  }

  async resendInvitation(token: string): Promise<APIPost<PendingInvitation>> {
    return this.client
      .post(`/invite/${token}/resend`)
      .then((response) => response.data as APIPost<PendingInvitation>)
      .catch((error) => {
        throw error?.response?.data || new Error("Failed to send it again");
      });
  }

  async revokeInvitation(token: string): Promise<APIDelete<{ id: string }>> {
    return this.client
      .delete(`/invite/${token}`)
      .then((response) => response.data as APIDelete<{ id: string }>)
      .catch((error) => {
        throw error?.response?.data || new Error("Failed to revoke invitation");
      });
  }

  async createProject(
    payload: CreateProjectPayload,
  ): Promise<APIPost<ProjectCache>> {
    return this.client
      .post("/project", {
        mode: "create",
        project: {
          name: payload.name,
          description: payload.description ?? "",
          coverImage: payload.coverImage ?? null,
        },
        // templateColumns: payload.templateColumns ?? [],
      })
      .then((response) => response.data as APIPost<ProjectCache>)
      .catch((error) => {
        throw error?.response?.data || new Error("Failed to create project");
      });
  }
}

export const projectServices = new ProjectService();
