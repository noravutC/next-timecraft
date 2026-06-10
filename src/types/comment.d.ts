import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type {
  commentReadStateTable,
  taskCommentAttachmentsTable,
  taskCommentReactionsTable,
  taskCommentsTable,
} from "@/db/schema";

export type TaskCommentRow = InferSelectModel<typeof taskCommentsTable>;
export type NewTaskCommentRow = InferInsertModel<typeof taskCommentsTable>;
export type TaskComment = TaskCommentRow;

export type CommentReadStateRow = InferSelectModel<typeof commentReadStateTable>;

export type TaskCommentAttachment = InferSelectModel<
  typeof taskCommentAttachmentsTable
>;
export type NewTaskCommentAttachment = InferInsertModel<
  typeof taskCommentAttachmentsTable
>;

export type TaskCommentReaction = InferSelectModel<
  typeof taskCommentReactionsTable
>;

export interface ReactionSummary {
  emoji: string;
  count: number;
  userIds: string[];
}

export interface TaskCommentWithAuthor extends TaskComment {
  authorName: string;
  authorAvatar: string | null;
  attachments: TaskCommentAttachment[];
  reactions: ReactionSummary[];
}

export interface AttachmentInput {
  type: "image" | "video";
  storagePath: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
  durationMs?: number | null;
}

export interface CreateCommentPayload {
  body: string;
  mentions: string[];
  clientId: string;
  attachments?: AttachmentInput[];
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
