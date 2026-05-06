import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type {
  commentReadStateTable,
  taskCommentsTable,
} from "@/db/schema";

export type TaskCommentRow = InferSelectModel<typeof taskCommentsTable>;
export type NewTaskCommentRow = InferInsertModel<typeof taskCommentsTable>;
export type TaskComment = TaskCommentRow;

export type CommentReadStateRow = InferSelectModel<typeof commentReadStateTable>;

export interface TaskCommentWithAuthor extends TaskComment {
  authorName: string;
  authorAvatar: string | null;
}

export interface CreateCommentPayload {
  body: string;
  mentions: string[];
  clientId: string;
}

export interface UpdateCommentPayload {
  body: string;
  mentions: string[];
}

export interface FetchCommentsParams {
  cursor: string | null;
  limit: number;
}

export interface CommentsPage {
  items: TaskCommentWithAuthor[];
  nextCursor: string | null;
  hasMore: boolean;
  unreadCount: number;
}
