// src/lib/services/organization.service.ts
import apiClient from "../axios";
import {
  Membership,
  APIGet,
  APIPost,
  //   APIPut,
  //   APIError,
  //   APIPatch,
} from "@/types";

class MembershipService {
  private client = apiClient;

  async getMemberShipByUserId(userId: string): Promise<APIGet<Membership>> {
    return this.client
      .get(`/member-ship/${userId}`)
      .then((response) => response.data as APIGet<Membership>)
      .catch((error) => {
        throw (
          error?.response?.data || new Error("Failed to fetch membership")
        );
      });
  }
  async createMemberShip(data: Partial<Membership>): Promise<APIPost<Membership>> {
    return this.client
      .post(`/member-ship/`, data)
      .then((response) => response.data as APIPost<Membership>)
      .catch((error) => {
        throw (
          error?.response?.data || new Error("Failed to create membership")
        );
      });
  }
}

export const membershipServices = new MembershipService();
