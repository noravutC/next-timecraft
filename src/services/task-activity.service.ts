import apiClient from '@/lib/axios';
import type { APISingleGet, TaskActivityPage } from '@/types';

class TaskActivityService {
  private client = apiClient;

  /** newest first; pass the previous page's nextCursor for older entries */
  async list(
    taskId: string,
    cursor: string | null = null,
  ): Promise<APISingleGet<TaskActivityPage>> {
    return this.client
      .get(`/task/${taskId}/activity`, {
        params: cursor ? { cursor } : undefined,
      })
      .then((r) => r.data)
      .catch((e) => {
        throw e?.response?.data || new Error('Failed to fetch activity');
      });
  }
}

export const taskActivityServices = new TaskActivityService();
