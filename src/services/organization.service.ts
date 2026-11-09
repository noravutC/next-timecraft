// src/services/organization.service.ts
import apiClient from "@/lib/axios";
import type { WorkspaceInvitableRole } from "@/lib/rbac/workspace-permissions";
import {
  APIDelete,
  APIGet,
  APIPatch,
  APIPost,
  APISingleGet,
  ArchivedBoard,
  CreateOrganizationPayload,
  InviteToWorkspacePayload,
  InviteToWorkspaceResult,
  OrganizationCache,
  PendingWorkspaceInvitation,
  PendingWorkspaceInvitationWithInviter,
  UpdateOrganizationPayload,
  WorkspaceInvitationPreview,
  WorkspaceMembersResponse,
} from "@/types";

class OrganizationService {
  private client = apiClient;

  async getOrganizations(): Promise<APIGet<OrganizationCache>> {
    return this.client
      .get(`/organization`)
      .then((response) => response.data as APIGet<OrganizationCache>)
      .catch((error) => {
        throw (
          error?.response?.data || new Error("Failed to fetch organizations")
        );
      });
  }

  async createOrganization(
    payload: CreateOrganizationPayload,
  ): Promise<APIPost<OrganizationCache>> {
    return this.client
      .post(`/organization`, payload)
      .then((response) => response.data as APIPost<OrganizationCache>)
      .catch((error) => {
        throw (
          error?.response?.data || new Error("Failed to create organization")
        );
      });
  }

  async updateOrganization(
    organizationId: string,
    payload: UpdateOrganizationPayload,
  ): Promise<APIPatch<OrganizationCache>> {
    return this.client
      .patch(`/organization/${organizationId}`, payload)
      .then((response) => response.data as APIPatch<OrganizationCache>)
      .catch((error) => {
        throw error?.response?.data || new Error("Failed to save workspace");
      });
  }

  async getArchivedBoards(
    organizationId: string,
  ): Promise<APIGet<ArchivedBoard>> {
    return this.client
      .get(`/organization/${organizationId}/archived-boards`)
      .then((response) => response.data as APIGet<ArchivedBoard>)
      .catch((error) => {
        throw (
          error?.response?.data || new Error("Failed to load archived boards")
        );
      });
  }

  async getMembers(
    organizationId: string,
  ): Promise<APISingleGet<WorkspaceMembersResponse>> {
    return this.client
      .get(`/organization/${organizationId}/members`)
      .then(
        (response) => response.data as APISingleGet<WorkspaceMembersResponse>,
      )
      .catch((error) => {
        throw error?.response?.data || new Error("Failed to load members");
      });
  }

  async changeMemberRole(
    organizationId: string,
    userId: string,
    role: WorkspaceInvitableRole,
  ): Promise<APIPatch<{ userId: string; role: WorkspaceInvitableRole }>> {
    return this.client
      .patch(`/organization/${organizationId}/members/${userId}`, { role })
      .then(
        (response) =>
          response.data as APIPatch<{
            userId: string;
            role: WorkspaceInvitableRole;
          }>,
      )
      .catch((error) => {
        throw error?.response?.data || new Error("Failed to change role");
      });
  }

  async removeMember(
    organizationId: string,
    userId: string,
  ): Promise<APIDelete<{ userId: string }>> {
    return this.client
      .delete(`/organization/${organizationId}/members/${userId}`)
      .then((response) => response.data as APIDelete<{ userId: string }>)
      .catch((error) => {
        throw error?.response?.data || new Error("Failed to remove member");
      });
  }

  async addGuest(
    organizationId: string,
    userId: string,
  ): Promise<APIPost<{ userId: string }>> {
    return this.client
      .post(`/organization/${organizationId}/members`, { userId })
      .then((response) => response.data as APIPost<{ userId: string }>)
      .catch((error) => {
        throw error?.response?.data || new Error("Failed to add to workspace");
      });
  }

  async getInvitations(
    organizationId: string,
  ): Promise<APIGet<PendingWorkspaceInvitationWithInviter>> {
    return this.client
      .get(`/organization/${organizationId}/invitations`)
      .then(
        (response) =>
          response.data as APIGet<PendingWorkspaceInvitationWithInviter>,
      )
      .catch((error) => {
        throw error?.response?.data || new Error("Failed to load invitations");
      });
  }

  async revokeInvitation(
    organizationId: string,
    invitationId: string,
  ): Promise<APIDelete<{ id: string }>> {
    return this.client
      .delete(`/organization/${organizationId}/invitations/${invitationId}`)
      .then((response) => response.data as APIDelete<{ id: string }>)
      .catch((error) => {
        throw error?.response?.data || new Error("Failed to revoke invitation");
      });
  }

  async resendInvitation(
    organizationId: string,
    invitationId: string,
  ): Promise<APIPost<PendingWorkspaceInvitation>> {
    return this.client
      .post(
        `/organization/${organizationId}/invitations/${invitationId}/resend`,
      )
      .then((response) => response.data as APIPost<PendingWorkspaceInvitation>)
      .catch((error) => {
        throw error?.response?.data || new Error("Failed to send it again");
      });
  }

  async inviteToWorkspace(
    organizationId: string,
    payload: InviteToWorkspacePayload,
  ): Promise<APIPost<InviteToWorkspaceResult>> {
    return this.client
      .post(`/organization/${organizationId}/invitations`, payload)
      .then((response) => response.data as APIPost<InviteToWorkspaceResult>)
      .catch((error) => {
        throw error?.response?.data || new Error("Failed to send invitations");
      });
  }

  async getWorkspaceInvitation(
    token: string,
  ): Promise<APISingleGet<WorkspaceInvitationPreview>> {
    return this.client
      .get(`/join/${token}`)
      .then(
        (response) => response.data as APISingleGet<WorkspaceInvitationPreview>,
      )
      .catch((error) => {
        throw error?.response?.data || new Error("Failed to fetch invitation");
      });
  }

  async acceptWorkspaceInvitation(
    token: string,
  ): Promise<APIPost<{ organizationId: string }>> {
    return this.client
      .post(`/join/${token}`)
      .then(
        (response) => response.data as APIPost<{ organizationId: string }>,
      )
      .catch((error) => {
        throw error?.response?.data || new Error("Failed to accept invitation");
      });
  }
}

export const organizationServices = new OrganizationService();
