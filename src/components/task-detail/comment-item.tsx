"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2, Check, X } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatRelativePast } from "@/helper/utils/date-format";
import type { TaskCommentWithAuthor } from "@/types";
import { useCommentStore } from "@/store/use-comment.store";
import { CommentAvatar } from "./comment-avatar";

interface CommentItemProps {
  comment: TaskCommentWithAuthor;
  isOwn: boolean;
}

export const CommentItem = ({ comment, isOwn }: CommentItemProps) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const update = useCommentStore((s) => s.update);
  const remove = useCommentStore((s) => s.remove);

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
                "rounded-md border px-4 py-2.5 text-sm whitespace-pre-wrap break-words border-border text-foreground",
                isOwn
                  ? "bg-muted/80"
                  : "bg-muted/30",
              )}
            >
              {comment.body}
            </div>
            <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
              <button type="button" className="hover:text-foreground">
                Reply
              </button>
              {/* <button type="button" className="hover:text-foreground">
                React
              </button> */}
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
