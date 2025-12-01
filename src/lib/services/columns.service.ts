// src/lib/services/columns.service.ts
import apiClient from "../axios";
import {
  Column,
  APIGet,
  APISingleGet,
  APIPost,
  // APIPut,
  // APIError,
  // APIPatch,
  CombineColumnTask,
  APIPatch,
  // ColumnWithBoardData,
} from "@/types";

class ColumnService {
  private client = apiClient;

  async getBoardsAndTasksByProjectId(
    projectId: string
  ): Promise<APIGet<CombineColumnTask>> {
    return this.client
      .get(`/column/look-up/project/${projectId}/`)
      .then((response) => response.data as APIGet<CombineColumnTask>)
      .catch((error) => {
        throw (
          error?.response?.data ||
          new Error("Failed to fetch boards and tasks by projectId")
        );
      });
  }

  async createColumn(
    projectId: string,
    columnData: Partial<Column>
  ): Promise<APIPost<Column>> {
    return this.client
      .post(`/column/`, { projectId, ...columnData })
      .then((response) => response.data as APIPost<Column>)
      .catch((error) => {
        throw (
          error?.response?.data ||
          new Error("Failed to create column by projectId")
        );
      });
  }

  async updateColumn(
    columnId: string,
    columnData: Partial<Column>
  ): Promise<APIPatch<Column>> {
    return this.client
      .patch(`/column/${columnId}`, columnData)
      .then((response) => response.data as APIPatch<Column>)
      .catch((error) => {
        throw (
          error?.response?.data || new Error("Failed to update column")
        );
      });
  }
}

export const columnServices = new ColumnService();
