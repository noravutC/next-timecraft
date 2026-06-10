"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { useUserStore, useProjectStore } from "@/store";
import { useShallow } from "zustand/react/shallow";
import { useCommentStore } from "@/store/use-comment.store";
import { applyWrap } from "@/helper/utils/markdown-editor";
import {
  buildMentionInsertion,
  extractMentionIds,
} from "@/helper/utils/mention";
import type { AttachmentInput } from "@/types";
import { MentionDropdown, type MentionCandidate } from "./mention-dropdown";
import { AttachmentPreviewTile } from "./parts/attachment-preview-tile";
import { MarkdownView } from "./parts/markdown-view";
import { HiddenFileInput } from "./parts/hidden-file-input";
import { ComposerToolbar } from "./parts/composer-toolbar";
import { useAttachmentUploads } from "./use-attachment-uploads";
import { useMentionPicker } from "./use-mention-picker";

interface CommentComposerProps {
  taskId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
}

export const CommentComposer = ({
  taskId,
  authorId,
  authorName,
  authorAvatar,
}: CommentComposerProps) => {
  const [value, setValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [preview, setPreview] = useState(false);

  const taRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const anyInputRef = useRef<HTMLInputElement>(null);

  const projectIsUsing = useProjectStore((s) => s.projectIsUsing);
  const project = useProjectStore((s) =>
    projectIsUsing ? s.projects[projectIsUsing] : null,
  );
  const users = useUserStore(useShallow((s) => s.users));
  const create = useCommentStore((s) => s.create);

  const memberCandidates: MentionCandidate[] = useMemo(() => {
    if (!project?.members) return [];
    return project.members
      .map((m) => {
        const u = users[m.userId];
        return u
          ? { id: u.id, name: u.fullName, avatar: u.avatar ?? null }
          : null;
      })
      .filter((m): m is MentionCandidate => m !== null);
  }, [project?.members, users]);

  const mention = useMentionPicker(memberCandidates);
  const upload = useAttachmentUploads(taskId);

  const setValueAndCursor = (next: string, cursor: number) => {
    setValue(next);
    requestAnimationFrame(() => {
      const ta = taRef.current;
      if (!ta) return;
      ta.focus();
      ta.setSelectionRange(cursor, cursor);
    });
  };

  const handleWrap = (marker: string) => {
    const ta = taRef.current;
    if (!ta) return;
    const r = applyWrap(
      value,
      ta.selectionStart ?? 0,
      ta.selectionEnd ?? 0,
      marker,
    );
    setValueAndCursor(r.value, r.cursor);
  };

  const insertMention = (c: MentionCandidate) => {
    const ta = taRef.current;
    if (!ta) return;
    const r = buildMentionInsertion(
      value,
      ta.selectionStart ?? value.length,
      c.name,
    );
    setValue(r.value);
    mention.dismiss();
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(r.cursor, r.cursor);
    });
  };

  const updateValue = (next: string, caret: number) => {
    setValue(next);
    mention.updateForText(next, caret);
  };

  const submit = async () => {
    const trimmed = value.trim();
    const ready = upload.pending.filter((p) => p.status === "ready");
    if (upload.pending.some((p) => p.status === "uploading")) {
      toast.message("Wait for uploads to finish");
      return;
    }
    if (!trimmed && ready.length === 0) return;
    if (isSending) return;

    setIsSending(true);
    const mentions = extractMentionIds(trimmed, memberCandidates);
    const inputs: AttachmentInput[] = ready
      .map((p) => p.attachment)
      .filter((a): a is AttachmentInput => !!a);

    setValue("");
    mention.dismiss();
    upload.clearAll();

    await create(taskId, {
      body: trimmed,
      mentions,
      authorId,
      authorName,
      authorAvatar,
      attachmentInputs: inputs,
    });
    setIsSending(false);
  };

  const canSend =
    !isSending &&
    !upload.pending.some((p) => p.status === "uploading") &&
    (value.trim().length > 0 ||
      upload.pending.some((p) => p.status === "ready"));

  return (
    <div className="shrink-0 pt-2 pb-4">
      <HiddenFileInput
        ref={imageInputRef}
        accept="image/png,image/jpeg,image/webp,image/gif"
        onFiles={upload.addFiles}
      />
      <HiddenFileInput
        ref={videoInputRef}
        accept="video/mp4,video/webm,video/quicktime"
        onFiles={upload.addFiles}
      />
      <HiddenFileInput
        ref={anyInputRef}
        accept="image/*,video/*"
        onFiles={upload.addFiles}
      />

      <div
        className="flex flex-col rounded-md border border-border bg-background p-2 px-3 shadow-sm focus-within:border-primary focus-within:shadow-md"
        onDragOver={(e) => e.preventDefault()}
        onDrop={upload.onDrop}
      >
        {mention.isOpen && (
          <MentionDropdown
            candidates={mention.filtered}
            activeIndex={mention.activeIdx}
            onSelect={insertMention}
            onHover={mention.setActiveIdx}
          />
        )}

        <div className="flex items-start gap-3">
          <div className="flex-1">
            {preview ? (
              <div className="min-h-9 py-1.5 text-sm">
                <MarkdownView value={value} />
              </div>
            ) : (
              <Textarea
                ref={taRef}
                value={value}
                onChange={(e) => {
                  const ta = e.target;
                  updateValue(ta.value, ta.selectionStart ?? ta.value.length);
                }}
                onPaste={upload.onPaste}
                onKeyDown={(e) => {
                  if (mention.isOpen) {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      mention.moveDown();
                      return;
                    }
                    if (e.key === "ArrowUp") {
                      e.preventDefault();
                      mention.moveUp();
                      return;
                    }
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      insertMention(mention.filtered[mention.activeIdx]);
                      return;
                    }
                    if (e.key === "Escape") {
                      mention.dismiss();
                      return;
                    }
                  }
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                    e.preventDefault();
                    submit();
                    return;
                  }
                  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
                    e.preventDefault();
                    handleWrap("**");
                    return;
                  }
                  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "i") {
                    e.preventDefault();
                    handleWrap("*");
                    return;
                  }
                }}
                placeholder="Write a comment… use @ to mention"
                className="min-h-9 resize-none border-0 bg-transparent p-0 py-1.5 text-sm shadow-none focus-visible:ring-0"
              />
            )}

            {upload.pending.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {upload.pending.map((p) => (
                  <AttachmentPreviewTile
                    key={p.id}
                    pending={p}
                    onRemove={upload.removePending}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <ComposerToolbar
          preview={preview}
          canSend={canSend}
          onTogglePreview={() => setPreview((p) => !p)}
          onSend={submit}
          onPickImage={() => imageInputRef.current?.click()}
          onPickVideo={() => videoInputRef.current?.click()}
          onPickAny={() => anyInputRef.current?.click()}
        />
      </div>
    </div>
  );
};
