// src/lib/services/tasks.service.ts
import apiClient from '@/lib/axios';

import {
  APIDelete,
  APIGet,
  APIPatch,
  APIPost,
  TaskCache,
  TaskFilter,
  TaskPageCursor,
  TaskPageInfo,
  CreateTaskPayload,
  UpdateTaskPayload,
} from '@/types';

import type { TaskAssigneeUser } from './assignee.service';

/** alias เดิม — shape เดียวกับ TaskAssigneeUser ของ assignee.service */
export type TaskAssigneeLite = TaskAssigneeUser;

class TaskService {
  private client = apiClient;

  async getTasksByColumns(
    colIds: string[],
    limit: number,
    cursors?: Record<string, TaskPageCursor>,
    filter?: TaskFilter,
  ): Promise<
    APIGet<TaskCache> & {
      assignees: Record<string, TaskAssigneeLite[]>;
      pageInfo: Record<string, TaskPageInfo>;
    }
  > {
    return this.client
      .post(`/task/columns`, {
        colIds,
        limit,
        ...(cursors ? { cursors } : {}),
        ...(filter ? { filter } : {}),
      })
      .then(
        (response) =>
          response.data as APIGet<TaskCache> & {
            assignees: Record<string, TaskAssigneeLite[]>;
            pageInfo: Record<string, TaskPageInfo>;
          },
      )
      .catch((error) => {
        throw (
          error?.response?.data ||
          new Error('Failed to fetch boards and tasks by columns')
        );
      });
  }
  async createTasks(
    payload: CreateTaskPayload[],
  ): Promise<APIPost<TaskCache[]>> {
    return this.client
      .post(`/task/`, payload)
      .then((response) => response.data as APIPost<TaskCache[]>)
      .catch((error) => {
        throw error?.response?.data || new Error('Failed to create tasks');
      });
  }
  async updateTasks(
    colIds: string[],
    payload: UpdateTaskPayload[],
  ): Promise<APIPatch<TaskCache[]>> {
    return this.client
      .patch(`/task/${colIds.join(',')}`, payload)
      .then((response) => response.data as APIPatch<TaskCache[]>)
      .catch((error) => {
        throw error?.response?.data || new Error('Failed to update tasks');
      });
  }
  async deleteTasks(colIds: string[]): Promise<APIDelete<boolean>> {
    return this.client
      .delete(`/task/${colIds.join(',')}`)
      .then((response) => response.data as APIDelete<boolean>)
      .catch((error) => {
        throw error?.response?.data || new Error('Failed to delete tasks');
      });
  }
}

export const taskServices = new TaskService();
