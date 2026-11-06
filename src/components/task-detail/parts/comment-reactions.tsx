'use client';

import { useState } from 'react';
import { SmilePlus } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { TaskCommentWithAuthor } from '@/types';
import { useCommentStore } from '@/store/use-comment.store';

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

interface ReactionProps {
  comment: TaskCommentWithAuthor;
  currentUserId: string;
}

/** The smiley button that opens the emoji choices. */
export const ReactionPicker = ({
  comment,
  currentUserId,
  disabled,
  className,
}: ReactionProps & { disabled?: boolean; className?: string }) => {
  const [open, setOpen] = useState(false);
  const toggleReaction = useCommentStore((s) => s.toggleReaction);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          disabled={disabled}
          aria-label="Add reaction"
          className={cn('rounded-full text-ink-subtle', className)}
        >
          <SmilePlus className="size-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="flex w-auto gap-0.5 p-1">
        {REACTION_EMOJIS.map((emoji) => (
          <Button
            key={emoji}
            variant="ghost"
            size="icon"
            aria-label={`React with ${emoji}`}
            onClick={() => {
              toggleReaction(comment.id, comment.taskId, emoji, currentUserId);
              setOpen(false);
            }}
            className="text-base"
          >
            {emoji}
          </Button>
        ))}
      </PopoverContent>
    </Popover>
  );
};

/** Existing reactions as pills, then the add-reaction button. */
export const CommentReactions = ({
  comment,
  currentUserId,
  disabled,
}: ReactionProps & { disabled?: boolean }) => {
  const toggleReaction = useCommentStore((s) => s.toggleReaction);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {comment.reactions.map((r) => {
        const reacted = r.userIds.includes(currentUserId);
        return (
          <Button
            key={r.emoji}
            variant="outline"
            size="xs"
            aria-pressed={reacted}
            onClick={() =>
              toggleReaction(comment.id, comment.taskId, r.emoji, currentUserId)
            }
            className={cn(
              'h-6 gap-1 rounded-full border-line px-2 font-normal text-ink-muted',
              reacted && 'border-brand-line bg-brand-soft text-ink',
            )}
          >
            <span>{r.emoji}</span>
            {r.count}
          </Button>
        );
      })}
      <ReactionPicker
        comment={comment}
        currentUserId={currentUserId}
        disabled={disabled}
      />
    </div>
  );
};
