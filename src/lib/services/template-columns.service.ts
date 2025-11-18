// src/lib/services/template-columns.service.ts
import apiClient from "../axios";
import { TemplateColumn, Project, Column, APIGet, APIPut } from "@/types";

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
  async applyTemplateColumnsToProject(
    projectId: string,
    template: TemplateColumn
  ): Promise<APIPut<Column[]>> {
    return this.client
      .put(`/template-column/apply-to-project/`, {
        projectId,
        template,
      })
      .then((response) => response.data as APIPut<Column[]>)
      .catch((error) => {
        throw (
          error?.response?.data ||
          new Error("Failed to apply template columns to project.")
        );
      });
  }
}

export const templateColumnsServices = new TemplateColumnsService();
