// src/lib/services/organization.service.ts
import apiClient from "../axios";
import {
  Organizations,
  APIGet,
  APIPost,
  //   APIPut,
  //   APIError,
  //   APIPatch,
} from "@/types";

class OrganizationService {
  private client = apiClient;

  async getOrganizations(): Promise<APIGet<Organizations>> {
    return this.client
      .get(`/organization/`)
      .then((response) => response.data as APIGet<Organizations>)
      .catch((error) => {
        throw (
          error?.response?.data || new Error("Failed to fetch organizations")
        );
      });
  }
  async createOrganization(data: Partial<Organizations>): Promise<APIPost<Organizations>> {
    return this.client
      .post(`/organization/`, data)
      .then((response) => response.data as APIPost<Organizations>)
      .catch((error) => {
        throw (
          error?.response?.data || new Error("Failed to create organization")
        );
      });
  }
}

export const organizationServices = new OrganizationService();
