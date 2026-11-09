'use client';

import { useEffect, useRef } from 'react';
import { MessageSquare } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useCommentStore } from '@/store/use-comment.store';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { CommentItem } from './comment-item';

interface CommentListProps {
  taskId: string;
  currentUserId: string;
  canReact: boolean;
  canManageOwn: boolean;
}

export const CommentList = ({
  taskId,
  currentUserId,
  canReact,
  canManageOwn,
}: CommentListProps) => {
  const state = useCommentStore(useShallow((s) => s.byTask[taskId]));
  const items = useCommentStore(useShallow((s) => s.chronological(taskId)));
  const fetchMore = useCommentStore((s) => s.fetchMore);
  const markRead = useCommentStore((s) => s.markRead);
  const markedRef = useRef<string | null>(null);

  const hasMore = state?.hasMore ?? false;
  const status = state?.status ?? 'none';
  const initialized = state?.initialized ?? false;

  useEffect(() => {
    if (!items.length) return;
    const newest = items.findLast((c) => !c.id.startsWith('temp-'));
    if (newest && markedRef.current !== newest.id) {
      markedRef.current = newest.id;
      markRead(taskId, newest.id);
    }
  }, [items, markRead, taskId]);

  if (!initialized && status === 'fetching') {
    return (
      <div className="flex justify-center py-8">
        <Loader size="sm" />
      </div>
    );
  }

  if (initialized && items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1.5 py-10 text-center">
        <span className="mb-1 grid size-9 place-items-center rounded-lg border border-line text-ink-subtle">
          <MessageSquare className="size-4" />
        </span>
        <span className="text-base font-medium text-ink">No comments yet</span>
        <span className="text-sm text-ink-subtle">
          Start the discussion below.
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5.5">
      {hasMore && (
        <Button
          variant="ghost"
          size="xs"
          onClick={() => fetchMore(taskId)}
          disabled={status === 'fetching'}
          className="self-center text-ink-muted"
        >
          {status === 'fetching' ? <Loader size="xs" /> : 'Load older'}
        </Button>
      )}
      {items.map((c) => (
        <CommentItem
          key={c.id}
          comment={c}
          isOwn={c.userId === currentUserId}
          currentUserId={currentUserId}
          canReact={canReact}
          canManageOwn={canManageOwn}
        />
      ))}
    </div>
  );
};
