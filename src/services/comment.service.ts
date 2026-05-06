import apiClient from "@/lib/axios";
import type {
  APIGet,
  APIPost,
  APIPatch,
  APIDelete,
  CommentsPage,
  CreateCommentPayload,
  TaskCommentWithAuthor,
  UpdateCommentPayload,
} from "@/types";

class CommentService {
  private client = apiClient;

  async fetchPage(
    taskId: string,
    cursor: string | null,
    limit: number,
  ): Promise<APIGet<CommentsPage> & { data: CommentsPage }> {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    params.set("limit", String(limit));
    return this.client
      .get(`/task/${taskId}/comments?${params.toString()}`)
      .then((r) => r.data)
      .catch((e) => {
        throw e?.response?.data || new Error("Failed to fetch comments");
      });
  }

  async create(
    taskId: string,
    payload: CreateCommentPayload,
  ): Promise<APIPost<TaskCommentWithAuthor>> {
    return this.client
      .post(`/task/${taskId}/comments`, payload)
      .then((r) => r.data)
      .catch((e) => {
        throw e?.response?.data || new Error("Failed to create comment");
      });
  }

  async update(
    commentId: string,
    payload: UpdateCommentPayload,
  ): Promise<APIPatch<TaskCommentWithAuthor>> {
    return this.client
      .patch(`/comment/${commentId}`, payload)
      .then((r) => r.data)
      .catch((e) => {
        throw e?.response?.data || new Error("Failed to update comment");
      });
  }

  async remove(commentId: string): Promise<APIDelete<boolean>> {
    return this.client
      .delete(`/comment/${commentId}`)
      .then((r) => r.data)
      .catch((e) => {
        throw e?.response?.data || new Error("Failed to delete comment");
      });
  }

  async markRead(
    taskId: string,
    lastReadCommentId: string,
  ): Promise<APIPost<{ ok: true }>> {
    return this.client
      .post(`/task/${taskId}/comments/read`, { lastReadCommentId })
      .then((r) => r.data)
      .catch((e) => {
        throw e?.response?.data || new Error("Failed to mark read");
      });
  }
}

export const commentServices = new CommentService();
