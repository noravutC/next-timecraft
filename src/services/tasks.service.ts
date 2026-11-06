// src/lib/services/tasks.service.ts
import apiClient from '@/lib/axios';

import {
  APIDelete,
  APIGet,
  APIPatch,
  APIPost,
  APISingleGet,
  BoardArchive,
  TaskCache,
  TaskFilter,
  DueBounds,
  DueBucket,
  TaskWithBoard,
  TaskPageCursor,
  TaskPageInfo,
  SubtaskProgress,
  PriorityCounts,
  CreateTaskPayload,
  UpdateTaskPayload,
} from '@/types';

import type { TaskAssigneeUser } from './assignee.service';

export type FilterCounts = { due: Record<DueBucket, number>; mine: number };

/** A copy of a task, with what its card shows besides the task row. */
export type DuplicatedTask = APIPost<TaskCache> & {
  assignees: TaskAssigneeUser[];
  subtasks: Record<string, SubtaskProgress>;
};

/** alias เดิม — shape เดียวกับ TaskAssigneeUser ของ assignee.service */
export type TaskAssigneeLite = TaskAssigneeUser;

class TaskService {
  private client = apiClient;

  /** How many tasks each Due date option and "Assigned to me" would show. */
  async getFilterCounts(
    colIds: string[],
    dueBounds: DueBounds,
  ): Promise<FilterCounts> {
    return this.client
      .post('/task/filter-counts', { colIds, dueBounds })
      .then((response) => response.data.data as FilterCounts)
      .catch((error) => {
        throw error?.response?.data || new Error('Failed to count tasks');
      });
  }

  async getTasksByColumns(
    colIds: string[],
    limit: number,
    cursors?: Record<string, TaskPageCursor>,
    filter?: TaskFilter,
  ): Promise<
    APIGet<TaskCache> & {
      assignees: Record<string, TaskAssigneeLite[]>;
      subtasks: Record<string, SubtaskProgress>;
      /** unread comments for the signed-in user, by task id */
      unread?: Record<string, number>;
      priorityCounts: Record<string, PriorityCounts>;
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
            subtasks: Record<string, SubtaskProgress>;
            /** unread comments for the signed-in user, by task id */
            unread?: Record<string, number>;
            priorityCounts: Record<string, PriorityCounts>;
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
  async getTasksByIds(taskIds: string[]): Promise<APIGet<TaskWithBoard>> {
    return this.client
      .get(`/task/${taskIds.join(',')}`)
      .then((response) => response.data as APIGet<TaskWithBoard>)
      .catch((error) => {
        throw error?.response?.data || new Error('Failed to fetch tasks');
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
  async duplicateTask(taskId: string): Promise<DuplicatedTask> {
    return this.client
      .post(`/task/${taskId}/duplicate`)
      .then((response) => response.data as DuplicatedTask)
      .catch((error) => {
        throw (
          error?.response?.data || new Error('Failed to duplicate the task')
        );
      });
  }
  async moveTaskToBoard(
    taskId: string,
    projectId: string,
  ): Promise<APIPatch<TaskWithBoard>> {
    return this.client
      .post(`/task/${taskId}/move`, { projectId })
      .then((response) => response.data as APIPatch<TaskWithBoard>)
      .catch((error) => {
        throw error?.response?.data || new Error('Failed to move the task');
      });
  }
  async getBoardArchive(
    projectId: string,
  ): Promise<APISingleGet<BoardArchive>> {
    return this.client
      .get(`/project/${projectId}/archive`)
      .then((response) => response.data as APISingleGet<BoardArchive>)
      .catch((error) => {
        throw error?.response?.data || new Error('Failed to load the archive');
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
