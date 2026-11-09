'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Textarea } from '@/components/ui/textarea';
import { UserAvatar } from '@/components/people/user-avatar';
import { cn } from '@/lib/utils';
import { formatRelativePast } from '@/helper/utils/date-format';
import { shortName } from '@/helper/utils/person-name';
import type { TaskCommentWithAuthor } from '@/types';
import { useCommentStore } from '@/store/use-comment.store';
import { useUserStore } from '@/store/use-user.store';
import { useShallow } from 'zustand/react/shallow';
import { MarkdownView } from './parts/markdown-view';
import { CommentReactions, ReactionPicker } from './parts/comment-reactions';

interface CommentItemProps {
  comment: TaskCommentWithAuthor;
  isOwn: boolean;
  currentUserId: string;
  /** may react (not a viewer on an archived board, etc.) */
  canReact: boolean;
  /** may edit and delete their own comments */
  canManageOwn: boolean;
}

export const CommentItem = ({
  comment,
  isOwn,
  currentUserId,
  canReact,
  canManageOwn,
}: CommentItemProps) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const update = useCommentStore((s) => s.update);
  const mentionNames = useUserStore(
    useShallow((s) =>
      comment.mentions.map((id) => s.users[id]?.fullName ?? ''),
    ),
  );
  const remove = useCommentStore((s) => s.remove);

  const isPending = comment.id.startsWith('temp-');
  const hasReactions = comment.reactions.length > 0;

  // a comment you just posted lands at the bottom: bring it into view once
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (isPending && isOwn) ref.current?.scrollIntoView({ block: 'nearest' });
    // only on mount, when the optimistic comment first appears
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveEdit = async () => {
    const next = draft.trim();
    if (!next || next === comment.body) {
      setEditing(false);
      setDraft(comment.body);
      return;
    }
    setBusy(true);
    await update(comment.id, comment.taskId, {
      body: next,
      mentions: comment.mentions,
    });
    setBusy(false);
    setEditing(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await remove(comment.id, comment.taskId);
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <article
      ref={ref}
      className={cn(
        'group flex gap-3 transition-opacity',
        isPending && 'opacity-60',
      )}
    >
      <UserAvatar
        name={comment.authorName}
        image={comment.authorAvatar}
        seed={comment.userId}
        size="lg"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-ink">
            {shortName(comment.authorName)}
          </span>
          <span className="text-xs text-ink-subtle">
            {formatRelativePast(new Date(comment.createdAt))}
            {comment.editedAt && ' · edited'}
          </span>
          {/* hover actions; add-reaction sits here until there are reactions */}
          {!editing && !isPending && (
            <div className="-my-1 ml-auto flex items-center gap-0.5 self-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 has-data-[state=open]:opacity-100">
              {!hasReactions && canReact && (
                <ReactionPicker
                  comment={comment}
                  currentUserId={currentUserId}
                />
              )}
              {isOwn && canManageOwn && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label="Comment actions"
                    >
                      <MoreHorizontal className="size-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36">
                    <DropdownMenuItem onClick={() => setEditing(true)}>
                      <Pencil />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setConfirmDelete(true)}
                    >
                      <Trash2 />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}
        </div>

        {editing ? (
          <div className="flex flex-col gap-2">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              aria-label="Edit comment"
              className="min-h-16 resize-none"
              autoFocus
            />
            <div className="flex gap-1.5">
              <Button size="xs" onClick={saveEdit} disabled={busy}>
                Save
              </Button>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => {
                  setEditing(false);
                  setDraft(comment.body);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            {comment.body && (
              <div className="text-base leading-5.5 break-words text-ink">
                <MarkdownView
                  value={comment.body}
                  mentionNames={mentionNames}
                />
              </div>
            )}
            {comment.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {comment.attachments.map((a) => (
                  <a
                    key={a.id}
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    className="relative h-42 w-70 overflow-hidden rounded-lg border border-line bg-surface"
                  >
                    {a.type === 'image' ? (
                      <Image
                        src={a.url}
                        alt="Image attachment"
                        fill
                        sizes="280px"
                        className="object-cover"
                      />
                    ) : (
                      <video
                        src={a.url}
                        controls
                        className="size-full object-cover"
                      />
                    )}
                  </a>
                ))}
              </div>
            )}
            {hasReactions && (
              <CommentReactions
                comment={comment}
                currentUserId={currentUserId}
                disabled={isPending || !canReact}
              />
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        variant="destructive"
        title="Delete this comment?"
        description="This comment will be permanently removed. This action cannot be undone."
        primaryLabel={deleting ? 'Deleting…' : 'Delete comment'}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </article>
  );
};
