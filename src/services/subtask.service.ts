import apiClient from "@/lib/axios";
import type {
  APIDelete,
  APIGet,
  APIPatch,
  APIPost,
  CreateSubtaskPayload,
  Subtask,
  UpdateSubtaskPayload,
} from "@/types";

class SubtaskService {
  private client = apiClient;

  async list(taskId: string): Promise<APIGet<Subtask>> {
    return this.client
      .get(`/task/${taskId}/subtasks`)
      .then((r) => r.data)
      .catch((e) => {
        throw e?.response?.data || new Error("Failed to fetch subtasks");
      });
  }

  async create(
    taskId: string,
    payload: CreateSubtaskPayload,
  ): Promise<APIPost<Subtask>> {
    return this.client
      .post(`/task/${taskId}/subtasks`, payload)
      .then((r) => r.data)
      .catch((e) => {
        throw e?.response?.data || new Error("Failed to create subtask");
      });
  }

  async update(
    subtaskId: string,
    payload: UpdateSubtaskPayload,
  ): Promise<APIPatch<Subtask>> {
    return this.client
      .patch(`/subtask/${subtaskId}`, payload)
      .then((r) => r.data)
      .catch((e) => {
        throw e?.response?.data || new Error("Failed to update subtask");
      });
  }

  async remove(subtaskId: string): Promise<APIDelete<boolean>> {
    return this.client
      .delete(`/subtask/${subtaskId}`)
      .then((r) => r.data)
      .catch((e) => {
        throw e?.response?.data || new Error("Failed to delete subtask");
      });
  }
}

export const subtaskServices = new SubtaskService();
