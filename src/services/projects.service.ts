// src/services/project.service.ts
import apiClient from "@/lib/axios";
import { APIGet } from "@/types/global";
import {
  APIDelete,
  APIPatch,
  APIPost,
  ProjectCache,
  ProjectRow,
} from "@/types";
import type { ProjectSettings } from "@/types/project-settings";

export type ProjectTemplateColumnInput = {
  name: string;
  color?: string;
  wipLimit?: number;
  order?: number;
};

export type CreateProjectPayload = {
  name: string;
  description?: string;
  coverImage?: string | null;
  // templateColumns?: ProjectTemplateColumnInput[];
};

export type UpdateProjectPayload = {
  name?: string;
  description?: string;
  coverImage?: string | null;
  tags?: string[];
  archived?: boolean;
  settings?: ProjectSettings;
};

class ProjectService {
  private client = apiClient;

  async getProjects(
    projectIds: string[],
    fetchAll: boolean = false,
  ): Promise<APIGet<ProjectCache[]>> {
    return this.client
      .post("/project", { projectIds: projectIds.join(","), fetchAll })
      .then((response) => response.data as APIGet<ProjectCache[]>)
      .catch((error) => {
        throw error?.response?.data || new Error("Failed to fetch projects");
      });
  }

  async updateProject(
    projectId: string,
    payload: UpdateProjectPayload,
  ): Promise<APIPatch<ProjectRow>> {
    return this.client
      .patch(`/project/${projectId}`, payload)
      .then((response) => response.data as APIPatch<ProjectRow>)
      .catch((error) => {
        throw error?.response?.data || new Error("Failed to update project");
      });
  }

  async deleteProject(projectId: string): Promise<APIDelete<ProjectRow>> {
    return this.client
      .delete(`/project/${projectId}`)
      .then((response) => response.data as APIDelete<ProjectRow>)
      .catch((error) => {
        throw error?.response?.data || new Error("Failed to delete project");
      });
  }

  async createProject(
    payload: CreateProjectPayload,
  ): Promise<APIPost<ProjectCache>> {
    return this.client
      .post("/project", {
        mode: "create",
        project: {
          name: payload.name,
          description: payload.description ?? "",
          coverImage: payload.coverImage ?? null,
        },
        // templateColumns: payload.templateColumns ?? [],
      })
      .then((response) => response.data as APIPost<ProjectCache>)
      .catch((error) => {
        throw error?.response?.data || new Error("Failed to create project");
      });
  }
}

export const projectServices = new ProjectService();
