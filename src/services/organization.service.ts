// src/services/organization.service.ts
import apiClient from "@/lib/axios";
import {
  APIGet,
  APIPost,
  CreateOrganizationPayload,
  OrganizationCache,
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
}

export const organizationServices = new OrganizationService();
