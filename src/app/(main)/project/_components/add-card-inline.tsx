"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useTaskStore } from "@/store/use-task.store";
import { generateFractionBetween } from "@/helper/utils/fraction-string-indexing";
import { blockBoardPanningAttr } from "./data-attributes";

interface AddCardInlineProps {
  columnId: string;
  lastOrderFraction: string | null;
  onClose: () => void;
}

export const AddCardInline = ({ columnId, lastOrderFraction, onClose }: AddCardInlineProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const createTasks = useTaskStore((s) => s.createTasks);
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = async () => {
    const trimmed = title.trim();
    if (!trimmed || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const orderFraction = generateFractionBetween(lastOrderFraction, null);
      await createTasks([{ columnId, title: trimmed, orderFraction }]);
      setTitle("");
      textareaRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div
      className="mx-1 mt-2.5 flex flex-shrink-0 flex-col gap-2 rounded-xl border border-brand-line bg-white p-3 shadow-[0_5px_16px_rgba(91,80,230,0.1)]"
      {...{ [blockBoardPanningAttr]: true }}
    >
      <textarea
        ref={textareaRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Task title..."
        className="min-h-11.5 flex-1 resize-none bg-transparent text-sm leading-relaxed text-ink outline-none placeholder:text-gray-400"
      />
      <div className="flex flex-row items-center gap-2">
        <Button
          size="sm"
          disabled={!title.trim() || isSubmitting}
          onClick={handleSubmit}
          className="h-8 rounded-md bg-brand text-xs font-semibold hover:bg-brand-dark"
        >
          {isSubmitting ? "Adding..." : "Add card"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onClose}
          className="h-8 text-xs font-medium text-ink-subtle hover:text-ink"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};
