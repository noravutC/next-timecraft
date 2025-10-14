// src/lib/services/columns.service.ts
import apiClient from "../axios";
import {
  Column,
  APIGet,
  APISingleGet,
  APIPost,
  APIPut,
  APIError,
  APIPatch,
} from "@/types";

class ColumnService {
  private client = apiClient;

  async getColumnsByProjectId(projectId: string): Promise<APIGet<Column>> {
    return this.client
      .get(`/column/look-up/project/${projectId}/`)
      .then((response) => response.data as APIGet<Column>)
      .catch((error) => {
        throw error?.response?.data || new Error("Failed to fetch columns by projectId");
      });
  }

  async createColumn(projectId: string, columnData: Partial<Column>): Promise<APIPost<Column>> {
    return this.client
      .post(`/column/`, { projectId, ...columnData })
      .then((response) => response.data as APIPost<Column>)
      .catch((error) => {
        throw error?.response?.data || new Error("Failed to create column by projectId");
      });
  }
  
}

export const columnServices = new ColumnService();
