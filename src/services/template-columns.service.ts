// src/lib/services/template-columns.service.ts
import apiClient from "@/lib/axios";
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
    projectIdOrParams:
      | string
      | { projectId?: string; projectName?: string; template: TemplateColumn },
    templateArg?: TemplateColumn,
  ): Promise<
    APIPut<{
      projectId: string;
      columns: Column[];
    }>
  > {
    const payload =
      typeof projectIdOrParams === "string"
        ? { projectId: projectIdOrParams, template: templateArg }
        : projectIdOrParams;
    if (!payload?.template) {
      throw new Error("Missing template for applying template columns.");
    }
    return this.client
      .post(`/template-column/apply-to-project/`, {
        ...payload,
      })
      .then(
        (response) =>
          response.data as APIPut<{
            projectId: string;
            columns: Column[];
          }>,
      )
      .catch((error) => {
        throw (
          error?.response?.data ||
          new Error("Failed to apply template columns to project.")
        );
      });
  }
}

export const templateColumnsServices = new TemplateColumnsService();
