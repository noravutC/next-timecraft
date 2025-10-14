// src/lib/services/columns.service.ts
import apiClient from "../axios";
import { TemplateColumn, Project, APIGet, APIPut } from "@/types";

class TemplateColumnsService {
  private client = apiClient;

  async getTemplateColumns(): Promise<APIGet<TemplateColumn>> {
    return this.client
      .get(`/template-column/`)
      .then((response) => response.data as APIGet<TemplateColumn>)
      .catch((error) => {
        throw (
          error?.response?.data ||
          new Error("Failed to fetch template columns.")
        );
      });
  }
}

export const templateColumnsServices = new TemplateColumnsService();
