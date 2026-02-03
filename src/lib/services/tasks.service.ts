// src/lib/services/tasks.service.ts
import apiClient from "../axios";
import {
  Task,
  APIGet,
  APIPost,
  APIPatch,
} from "@/types";

class TaskService {
  private client = apiClient;

  async getTasksByColumnId(
    columnId: string,
    options?: { skip?: number; limit?: number; archived?: boolean },
  ): Promise<APIGet<Task>> {
    return this.client
      .get(`/task/look-up/column/${columnId}/`, { params: options })
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

  async updateOneTask(taskId: string, data: Partial<Task>): Promise<APIPatch<Task>> {
    return this.client
      .patch(`/task/${taskId}`, data)
      .then((response) => response.data as APIPatch<Task>)
      .catch((error) => {
        throw error?.response?.data || new Error("Failed to update task");
      });
  }

  async moveTaskToColumn(
    taskId: string,
    projectId: string,
    destinationColumnId: string,
  ): Promise<APIPatch<Task>> {
    return this.client
      .patch(`/task/${taskId}/move/`, { projectId, columnId: destinationColumnId })
      .then((response) => response.data as APIPatch<Task>)
      .catch((error) => {
        throw (
          error?.response?.data || new Error("Failed to move task to column")
        );
      });
  }

  async moveTaskToDestination(
    activeTaskId: string,
    jsonPayload: string,
  ): Promise<APIGet<Task>> {
    console.log('jsonPayload: ', jsonPayload);
    return this.client
      .patch(`/task/${activeTaskId}/move/`, { jsonPayload })
      .then((response) => response.data as APIGet<Task>)
      .catch((error) => {
        throw (
          error?.response?.data || new Error("Failed to move task to column")
        );
      });
  }
}

export const taskServices = new TaskService();
