// src/lib/services/columns.service.ts
import apiClient from "../axios";
import {
  User,
  APIGet,
  //   APISingleGet,
  //   APIPost,
  //   APIPut,
  //   APIError,
  //   APIPatch,
} from "@/types";

class UserService {
  private client = apiClient;

  async getUserById(userId: string): Promise<APIGet<User>> {
    return this.client
      .get(`/user/${userId}/`)
      .then((response) => response.data as APIGet<User>)
      .catch((error) => {
        throw (
          error?.response?.data || new Error("Failed to fetch users by userId")
        );
      });
  }

  async getUserByIds(userIds: string[]): Promise<APIGet<User>> {
    return this.client
      .post(`/user/look-up/multiple/`, { userIds: userIds })
      .then((response) => response.data as APIGet<User>)
      .catch((error) => {
        throw (
          error?.response?.data || new Error("Failed to fetch users by userId")
        );
      });
  }
}

export const userServices = new UserService();
