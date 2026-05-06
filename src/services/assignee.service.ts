import apiClient from "@/lib/axios";
import type { APIGet, APIPatch } from "@/types";

export interface TaskAssigneeUser {
  userId: string;
  fullName: string;
  avatar: string | null;
  email: string;
}

class AssigneeService {
  private client = apiClient;

  async list(taskId: string): Promise<APIGet<TaskAssigneeUser>> {
    return this.client
      .get(`/task/${taskId}/assignees`)
      .then((r) => r.data)
      .catch((e) => {
        throw e?.response?.data || new Error("Failed to fetch assignees");
      });
  }

  async setAll(
    taskId: string,
    userIds: string[],
  ): Promise<APIPatch<TaskAssigneeUser[]>> {
    return this.client
      .patch(`/task/${taskId}/assignees`, { userIds })
      .then((r) => r.data)
      .catch((e) => {
        throw e?.response?.data || new Error("Failed to update assignees");
      });
  }
}

export const assigneeServices = new AssigneeService();
