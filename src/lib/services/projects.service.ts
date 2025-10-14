// src/lib/services/project.service.ts
import apiClient from "../axios";
import {
  Project,
  APIGet,
  APISingleGet,
  APIPost,
  APIPut,
  APIError,
  APIPatch,
  TemplateColumn,
} from "@/types";

class ProjectService {
  private client = apiClient;

  async getProjects(): Promise<APIGet<Project>> {
    return this.client
      .get("/project")
      .then((response) => response.data as APIGet<Project>)
      .catch((error) => {
        throw error?.response?.data || new Error("Failed to fetch projects");
      });
  }

  async getProjectById(projectId: string): Promise<APISingleGet<Project>> {
    return this.client
      .get(`/project/${projectId}`)
      .then((response) => response.data as APISingleGet<Project>)
      .catch((error) => {
        throw error?.response?.data || new Error("Failed to fetch project");
      });
  }

  async createProject(project: Partial<Project>): Promise<APIPost<Project>> {
    return this.client
      .post("/project", project)
      .then((response) => response.data as APIPost<Project>)
      .catch((error) => {
        throw (
          (error?.response?.data as APIError) ||
          new Error("Failed to create project")
        );
      });
  }

  async applyTemplateColumnsToProject(
    projectId: string,
    template: TemplateColumn
  ): Promise<APIPut<Project>> {
    return this.client
      .put(`/project/apply-to-project/`, { projectId, template })
      .then((response) => response.data as APIPut<Project>)
      .catch((error) => {
        throw (
          error?.response?.data || new Error("Failed to apply template column.")
        );
      });
  }

}

export const projectServices = new ProjectService();
