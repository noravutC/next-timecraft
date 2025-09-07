// src/lib/services/tasks.service.ts
import apiClient from "../axios";
import {
  Task,
  APIGet,
  APISingleGet,
  APIPost,
  APIPut,
  APIError,
  APIPatch,
} from "@/types";

class TaskService {
  private client = apiClient;

  async getTasksByColumnId(columnId: string): Promise<APIGet<Task>> {
    return this.client
      .get(`/task/look-up/column/${columnId}/`)
      .then((response) => response.data as APIGet<Task>)
      .catch((error) => {
        throw error?.response?.data || new Error("Failed to fetch tasks by columnId");
      });
  }
  
}

export const taskServices = new TaskService();
