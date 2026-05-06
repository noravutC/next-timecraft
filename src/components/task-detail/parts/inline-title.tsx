"use client";

import { useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface InlineTitleProps {
  value: string;
  onCommit: (next: string) => void;
  className?: string;
}

export const InlineTitle = ({ value, onCommit, className }: InlineTitleProps) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (editing && ref.current) {
      const el = ref.current;
      el.focus();
      const end = el.value.length;
      el.setSelectionRange(end, end);
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [editing]);

  const commit = () => {
    const next = draft.trim();
    setEditing(false);
    if (next && next !== value) onCommit(next);
    else setDraft(value);
  };

  if (editing) {
    return (
      <Textarea
        ref={ref}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          e.target.style.height = "auto";
          e.target.style.height = `${e.target.scrollHeight}px`;
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            commit();
          } else if (e.key === "Escape") {
            setEditing(false);
            setDraft(value);
          }
        }}
        rows={1}
        className={cn(
          "min-h-0 resize-none border-0 bg-transparent p-0 text-2xl font-bold leading-tight shadow-none focus-visible:ring-0 md:text-2xl",
          className,
        )}
      />
    );
  }

  return (
    <div
      onClick={() => setEditing(true)}
      className={cn(
        "cursor-text text-2xl font-bold leading-tight",
        !value && "text-muted-foreground",
        className,
      )}
    >
      {value || "Untitled task"}
    </div>
  );
};
