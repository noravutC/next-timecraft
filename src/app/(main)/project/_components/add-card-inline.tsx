"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
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
      className="mx-3 my-1 flex flex-shrink-0 flex-col gap-2 min-h-30 rounded-md border border-blue-400 bg-white p-4 ring-1 ring-blue-400"
      {...{ [blockBoardPanningAttr]: true }}
    >
      <textarea
        ref={textareaRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Task title..."
        className="flex-1 resize-none bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
      />
      <div className="flex flex-row items-center gap-2">
        <Button
          size="sm"
          disabled={!title.trim() || isSubmitting}
          onClick={handleSubmit}
          className="h-7 text-xs"
        >
          {isSubmitting ? "Adding..." : "Add"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onClose}
          className="h-7 w-7 p-0"
        >
          <X size={14} />
        </Button>
      </div>
    </div>
  );
};
