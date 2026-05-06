"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface InlineDescriptionProps {
  value: string | null;
  onCommit: (next: string) => void;
}

export const InlineDescription = ({ value, onCommit }: InlineDescriptionProps) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editing) setDraft(value ?? "");
  }, [value, editing]);

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      ref.current.style.height = "auto";
      ref.current.style.height = `${Math.max(ref.current.scrollHeight, 64)}px`;
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if ((draft || "") !== (value || "")) onCommit(draft);
  };

  if (editing) {
    return (
      <textarea
        ref={ref}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          e.target.style.height = "auto";
          e.target.style.height = `${Math.max(e.target.scrollHeight, 64)}px`;
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setEditing(false);
            setDraft(value ?? "");
          }
        }}
        placeholder="Add a description…"
        className="w-full resize-none border-0 bg-transparent p-0 text-sm leading-relaxed outline-none"
      />
    );
  }

  return (
    <div
      onClick={() => setEditing(true)}
      className={cn(
        "cursor-text text-sm leading-relaxed min-h-17.5",
        !value && "text-muted-foreground",
      )}
    >
      {value ? (
        <p className="whitespace-pre-wrap">{value}</p>
      ) : (
        "Add a description…"
      )}
    </div>
  );
};
