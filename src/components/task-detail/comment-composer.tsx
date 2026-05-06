"use client";

import { useMemo, useRef, useState } from "react";
import {
  AtSign,
  Bold,
  Code,
  Image as ImageIcon,
  Italic,
  List,
  Paperclip,
  Send,
  Smile,
  Video,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useUserStore, useProjectStore } from "@/store";
import { useShallow } from "zustand/react/shallow";
import { useCommentStore } from "@/store/use-comment.store";
import {
  MentionDropdown,
  type MentionCandidate,
} from "./mention-dropdown";
import { CommentAvatar } from "./comment-avatar";

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
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

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

  const filteredCandidates = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase();
    return memberCandidates
      .filter((c) => c.name.toLowerCase().includes(q))
      .slice(0, 6);
  }, [mentionQuery, memberCandidates]);

  const detectMention = (text: string, caret: number) => {
    const upto = text.slice(0, caret);
    const match = upto.match(/(?:^|\s)@([^\s@]*)$/);
    return match ? match[1] : null;
  };

  const updateValue = (next: string, caret: number) => {
    setValue(next);
    const q = detectMention(next, caret);
    setMentionQuery(q);
    setActiveIdx(0);
  };

  const insertMention = (c: MentionCandidate) => {
    const ta = ref.current;
    if (!ta) return;
    const caret = ta.selectionStart ?? value.length;
    const upto = value.slice(0, caret);
    const after = value.slice(caret);
    const replaced = upto.replace(/@([^\s@]*)$/, `@${c.name} `);
    const next = replaced + after;
    setValue(next);
    setMentionQuery(null);
    setActiveIdx(0);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(replaced.length, replaced.length);
    });
  };

  const extractMentions = (text: string): string[] => {
    const ids = new Set<string>();
    for (const c of memberCandidates) {
      const re = new RegExp(
        `@${c.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=\\s|$)`,
      );
      if (re.test(text)) ids.add(c.id);
    }
    return Array.from(ids);
  };

  const submit = async () => {
    const trimmed = value.trim();
    if (!trimmed || isSending) return;
    setIsSending(true);
    const mentions = extractMentions(trimmed);
    setValue("");
    setMentionQuery(null);
    await create(taskId, {
      body: trimmed,
      mentions,
      authorId,
      authorName,
      authorAvatar,
    });
    setIsSending(false);
  };

  const toolbarGroups: React.ComponentType<{ className?: string }>[][] = [
    [Bold, Italic, Code, List],
    [ImageIcon, Video, Paperclip, AtSign, Smile],
  ];

  return (
    <div className="shrink-0 pt-2 pb-4">
      <div className="relative flex flex-col rounded-xl border border-border bg-background shadow-sm focus-within:border-foreground/40 focus-within:shadow-md">
        {filteredCandidates.length > 0 && (
          <MentionDropdown
            candidates={filteredCandidates}
            activeIndex={activeIdx}
            onSelect={insertMention}
            onHover={setActiveIdx}
          />
        )}
        <div className="flex items-center gap-3 px-3 pt-3">
          <CommentAvatar name={authorName} avatar={authorAvatar} />
          <Textarea
            ref={ref}
            value={value}
            onChange={(e) => {
              const ta = e.target;
              updateValue(ta.value, ta.selectionStart ?? ta.value.length);
            }}
            onKeyDown={(e) => {
              if (filteredCandidates.length > 0) {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActiveIdx((i) =>
                    Math.min(i + 1, filteredCandidates.length - 1),
                  );
                  return;
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActiveIdx((i) => Math.max(i - 1, 0));
                  return;
                }
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  insertMention(filteredCandidates[activeIdx]);
                  return;
                }
                if (e.key === "Escape") {
                  setMentionQuery(null);
                  return;
                }
              }
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Write a comment… use @ to mention"
            className="min-h-9 resize-none border-0 bg-transparent p-0 py-1.5 text-sm shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="mt-2 flex items-center justify-between gap-1 px-2 pb-2">
          <div className="flex min-w-0 items-center gap-1 text-muted-foreground">
            {toolbarGroups.map((group, gi) => (
              <div key={gi} className="flex items-center">
                {gi > 0 && (
                  <span className="mx-1 h-4 w-px bg-border" aria-hidden />
                )}
                {group.map((Icon, i) => (
                  <button
                    key={i}
                    type="button"
                    tabIndex={-1}
                    className="rounded p-1 hover:bg-muted hover:text-foreground"
                  >
                    <Icon className="size-4" />
                  </button>
                ))}
              </div>
            ))}
          </div>
          <Button
            size="xs"
            onClick={submit}
            disabled={!value.trim() || isSending}
            className="gap-2 text-xs"
          >
            <Send className="size-3.5" />
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};
