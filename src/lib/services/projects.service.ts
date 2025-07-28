// src/lib/services/project.service.ts
import apiClient from "../axios";
import {
  Projects,
  Columns,
  CreateTask,
  APIGet,
  APISingleGet,
  APIPost,
  APIPut,
  APIError,
  APIPatch,
} from "@/src/types";

class ProjectService {
  private client = apiClient;

  async getProjects(): Promise<APIGet<Projects>> {
    return this.client
      .get("/project")
      .then((response) => response.data as APIGet<Projects>)
      .catch((error) => {
        throw error?.response?.data || new Error("Failed to fetch projects");
      });
  }

  async getProjectById(projectId: string): Promise<APISingleGet<Projects>> {
    return this.client
      .get(`/project/${projectId}`)
      .then((response) => response.data as APISingleGet<Projects>)
      .catch((error) => {
        throw error?.response?.data || new Error("Failed to fetch project");
      });
  }

  async postProjects(project: Partial<Projects>): Promise<APIPost<Projects>> {
    return this.client
      .post("/project", project)
      .then((response) => response.data as APIPost<Projects>)
      .catch((error) => {
        throw (
          (error?.response?.data as APIError) ||
          new Error("Failed to create project")
        );
      });
  }

  async insertTaskByProjectId(projectId: string, task: CreateTask): Promise<APIPatch<Columns>> {
    return this.client
      .patch(`/project/${projectId}`, task)
      .then((response) => response.data as APIPatch<Columns>)
      .catch((error) => {
        throw error?.response?.data || new Error("Failed to fetch project");
      });
  }
}

export const projectServices = new ProjectService();
