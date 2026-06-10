"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2, Check, X, SmilePlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatRelativePast } from "@/helper/utils/date-format";
import type { TaskCommentWithAuthor } from "@/types";
import { useCommentStore } from "@/store/use-comment.store";
import { CommentAvatar } from "./comment-avatar";
import { MarkdownView } from "./parts/markdown-view";

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🎉"];

interface CommentItemProps {
  comment: TaskCommentWithAuthor;
  isOwn: boolean;
  currentUserId: string;
}

export const CommentItem = ({ comment, isOwn, currentUserId }: CommentItemProps) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const update = useCommentStore((s) => s.update);
  const remove = useCommentStore((s) => s.remove);
  const toggleReaction = useCommentStore((s) => s.toggleReaction);

  const isPending = comment.id.startsWith("temp-");
  const created = new Date(comment.createdAt);

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
    <div
      className={cn(
        "group flex gap-3 py-3 transition-opacity",
        isPending && "opacity-60",
      )}
    >
      <CommentAvatar name={comment.authorName} avatar={comment.authorAvatar} />

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            {comment.authorName}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatRelativePast(created)}
            {comment.editedAt && <span className="ml-1 italic">· edited</span>}
          </span>
          {/* {isOwn && (
            <span className="flex items-center gap-1 text-xs text-emerald-600">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              live
            </span>
          )} */}
        </div>

        {editing ? (
          <div className="space-y-2">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="min-h-16 resize-none text-sm"
              autoFocus
            />
            <div className="flex gap-1.5">
              <Button
                type="button"
                size="sm"
                className="h-6 gap-1 px-2 text-xs"
                onClick={saveEdit}
                disabled={busy}
              >
                <Check className="size-3" /> Save
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-6 gap-1 px-2 text-xs"
                onClick={() => {
                  setEditing(false);
                  setDraft(comment.body);
                }}
              >
                <X className="size-3" /> Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div
              className={cn(
                "rounded-md border px-4 py-2.5 text-sm break-words border-border text-foreground",
                isOwn ? "bg-muted/80" : "bg-muted/30",
              )}
            >
              {comment.body && (
                <div className="space-y-1">
                  <MarkdownView value={comment.body} />
                </div>
              )}
              {comment.attachments.length > 0 && (
                <div
                  className={cn(
                    "grid gap-2",
                    comment.body && "mt-2",
                    comment.attachments.length === 1
                      ? "grid-cols-1"
                      : "grid-cols-2",
                  )}
                >
                  {comment.attachments.map((a) => (
                    <a
                      key={a.id}
                      href={a.url}
                      target="_blank"
                      rel="noreferrer"
                      className="overflow-hidden rounded-md border border-border bg-background"
                    >
                      {a.type === "image" ? (
                        <img
                          src={a.url}
                          alt=""
                          className="max-h-80 w-full object-cover"
                        />
                      ) : (
                        <video
                          src={a.url}
                          controls
                          className="max-h-80 w-full object-cover"
                        />
                      )}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {comment.reactions.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {comment.reactions.map((r) => {
                  const reacted = r.userIds.includes(currentUserId);
                  return (
                    <button
                      key={r.emoji}
                      type="button"
                      onClick={() =>
                        toggleReaction(
                          comment.id,
                          comment.taskId,
                          r.emoji,
                          currentUserId,
                        )
                      }
                      className={cn(
                        "flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors",
                        reacted
                          ? "border-primary/40 bg-primary/10 text-foreground"
                          : "border-border bg-muted/40 text-muted-foreground hover:bg-muted",
                      )}
                    >
                      <span>{r.emoji}</span>
                      <span>{r.count}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
              <button type="button" className="hover:text-foreground">
                Reply
              </button>
              <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    disabled={isPending}
                    className="flex items-center gap-1 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <SmilePlus className="size-3.5" /> React
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  className="flex w-auto gap-1 p-1.5"
                >
                  {REACTION_EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => {
                        toggleReaction(
                          comment.id,
                          comment.taskId,
                          e,
                          currentUserId,
                        );
                        setPickerOpen(false);
                      }}
                      className="rounded p-1 text-base hover:bg-muted"
                    >
                      {e}
                    </button>
                  ))}
                </PopoverContent>
              </Popover>
            </div>
          </>
        )}
      </div>

      {isOwn && !editing && !isPending && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
            >
              <MoreHorizontal className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem onClick={() => setEditing(true)}>
              <Pencil className="size-3.5" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setConfirmDelete(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="size-3.5" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        variant="destructive"
        title="Delete this comment?"
        description="This comment will be permanently removed. This action cannot be undone."
        primaryLabel={deleting ? "Deleting…" : "Delete comment"}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
};
