// src/services/organization.service.ts
import apiClient from "@/lib/axios";
import {
  APIGet,
  APIPost,
  APISingleGet,
  CreateOrganizationPayload,
  InviteToWorkspacePayload,
  InviteToWorkspaceResult,
  OrganizationCache,
  WorkspaceInvitationPreview,
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
