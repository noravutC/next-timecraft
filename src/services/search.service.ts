import apiClient from '@/lib/axios';
import type { APIGet, TaskSearchHit } from '@/types';

class SearchService {
  private client = apiClient;

  async searchTasks(
    query: string,
    projectId: string | null,
    signal?: AbortSignal,
  ): Promise<APIGet<TaskSearchHit>> {
    const params = new URLSearchParams({ q: query });
    if (projectId) params.set('projectId', projectId);
    return this.client
      .get(`/search?${params.toString()}`, { signal })
      .then((response) => response.data as APIGet<TaskSearchHit>)
      .catch((error) => {
        throw error?.response?.data || new Error('Search failed');
      });
  }
}

export const searchServices = new SearchService();
