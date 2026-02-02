// src/lib/services/column-map.service.ts
import { ColumnMapTask } from "@/types/column-map";
import apiClient from "../axios";
import {
  APISingleGet,
} from "@/types";

class ColumnMapService {
  private client = apiClient;

  async fetchBoardColumnMapTaskByProjectId(
    projectId: string
  ): Promise<APISingleGet<ColumnMapTask[]>> {
    return this.client
      .get(`/column/map/task/${projectId}/`)
      .then((response) => response.data as APISingleGet<ColumnMapTask[]>)
      .catch((error) => {
        throw (
          error?.response?.data ||
          new Error("Failed to fetch board column map tasks by projectId in service.")
        );
      });
  }
}

export const columnMapServices = new ColumnMapService();
