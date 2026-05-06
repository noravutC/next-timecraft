"use client";

import { useEffect, useRef } from "react";
import { useCommentStore } from "@/store/use-comment.store";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { LoaderCircle, MessageSquare } from "lucide-react";
import { CommentItem } from "./comment-item";

interface CommentListProps {
  taskId: string;
  currentUserId: string;
}

export const CommentList = ({ taskId, currentUserId }: CommentListProps) => {
  const state = useCommentStore(
    useShallow((s) => s.byTask[taskId]),
  );
  const fetchMore = useCommentStore((s) => s.fetchMore);
  const markRead = useCommentStore((s) => s.markRead);
  const markedRef = useRef<string | null>(null);

  const items = state?.items ?? [];
  const hasMore = state?.hasMore ?? false;
  const status = state?.status ?? "none";
  const initialized = state?.initialized ?? false;

  useEffect(() => {
    if (!items.length) return;
    const newest = items.find((c) => !c.id.startsWith("temp-"));
    if (newest && markedRef.current !== newest.id) {
      markedRef.current = newest.id;
      markRead(taskId, newest.id);
    }
  }, [items, markRead, taskId]);

  if (!initialized && status === "fetching") {
    return (
      <div className="flex items-center justify-center py-6 text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin" />
      </div>
    );
  }

  if (initialized && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-muted-foreground">
        <MessageSquare className="size-7" />
        <p className="text-sm">No comments yet</p>
        <p className="text-xs">Start the discussion below</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 py-2">
      {items.map((c) => (
        <CommentItem
          key={c.id}
          comment={c}
          isOwn={c.userId === currentUserId}
        />
      ))}
      {hasMore && (
        <div className="flex items-center justify-center py-3">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => fetchMore(taskId)}
            disabled={status === "fetching"}
            className="text-xs"
          >
            {status === "fetching" ? (
              <LoaderCircle className="size-3.5 animate-spin" />
            ) : (
              "Load older"
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
