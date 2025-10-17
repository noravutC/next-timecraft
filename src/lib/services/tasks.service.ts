// src/lib/services/tasks.service.ts
import apiClient from "../axios";
import {
  Task,
  APIGet,
  // APISingleGet,
  APIPost,
  // APIPut,
  // APIError,
  // APIPatch,
} from "@/types";

class TaskService {
  private client = apiClient;

  async getTasksByColumnId(columnId: string): Promise<APIGet<Task>> {
    return this.client
      .get(`/task/look-up/column/${columnId}/`)
      .then((response) => response.data as APIGet<Task>)
      .catch((error) => {
        throw (
          error?.response?.data ||
          new Error("Failed to fetch tasks by columnId")
        );
      });
  }

  async createTask(data: Partial<Task>): Promise<APIPost<Task>> {
    return this.client
      .post(`/task/`, data)
      .then((response) => response.data as APIPost<Task>)
      .catch((error) => {
        throw error?.response?.data || new Error("Failed to create task");
      });
  }
}

export const taskServices = new TaskService();
