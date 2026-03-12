// src/services/project.service.ts
import apiClient from "@/lib/axios";
import { APIGet } from "@/types/global";
import { APIPost, ProjectCache } from "@/types";

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

class ProjectService {
  private client = apiClient;

  async getProjects(projectIds: string[], fetchAll: boolean = false): Promise<APIGet<ProjectCache[]>> {
    return this.client
      .post("/project", { projectIds: projectIds.join(","), fetchAll })
      .then((response) => response.data as APIGet<ProjectCache[]>)
      .catch((error) => {
        throw error?.response?.data || new Error("Failed to fetch projects");
      });
  }

  async createProject(payload: CreateProjectPayload): Promise<APIPost<ProjectCache>> {
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
