// src/services/columns.service.ts
import apiClient from "@/lib/axios";
import { APIGet } from "@/types/global";
import { APIDelete, APIPatch, APIPost, ColumnCache, CreateColumnPayload, UpdateColumnPayload } from "@/types";

class ColumnService {
  private client = apiClient;

  async getColumnsByProjectId(
    projectId: string,
    limit: number
  ): Promise<APIGet<ColumnCache[]>> {
    return this.client
      .get(`/column/${projectId}/?limit=${limit}`)
      .then((response) => response.data as APIGet<ColumnCache[]>)
      .catch((error) => {
        throw (
          error?.response?.data ||
          new Error("Failed to fetch boards and tasks by projectId")
        );
      });
  }
  async createColumns(
     payload: CreateColumnPayload[]
  ): Promise<APIPost<ColumnCache[]>> {
    return this.client
      .post(`/column/`, payload)
      .then((response) => response.data as APIPost<ColumnCache[]>)
      .catch((error) => {
        throw (
          error?.response?.data ||
          new Error("Failed to create columns")
        );
      });
  }
  async updateColumns(
     colIds: string[],
     payload: UpdateColumnPayload[]
  ): Promise<APIPatch<ColumnCache[]>> {
    return this.client
      .patch(`/column/${colIds.join(",")}`, payload)
      .then((response) => response.data as APIPatch<ColumnCache[]>)
      .catch((error) => {
        throw (
          error?.response?.data ||
          new Error("Failed to update columns")
        );
      });
  }
  async deleteColumns(
     colIds: string[]
  ): Promise<APIDelete<boolean>> {
    return this.client
      .delete(`/column/${colIds.join(",")}`)
      .then((response) => response.data as APIDelete<boolean>)
      .catch((error) => {
        throw (
          error?.response?.data ||
          new Error("Failed to delete columns")
        );
      });
  }

}

export const columnServices = new ColumnService();
