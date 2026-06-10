import { useMemo, useState } from "react";
import { detectMention } from "@/helper/utils/mention";
import type { MentionCandidate } from "./mention-dropdown";

export function useMentionPicker(candidates: MentionCandidate[]) {
  const [query, setQuery] = useState<string | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const filtered = useMemo(() => {
    if (query === null) return [];
    const q = query.toLowerCase();
    return candidates
      .filter((c) => c.name.toLowerCase().includes(q))
      .slice(0, 6);
  }, [query, candidates]);

  const updateForText = (text: string, caret: number) => {
    setQuery(detectMention(text, caret));
    setActiveIdx(0);
  };

  const dismiss = () => {
    setQuery(null);
    setActiveIdx(0);
  };

  const moveDown = () =>
    setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
  const moveUp = () => setActiveIdx((i) => Math.max(i - 1, 0));

  return {
    filtered,
    activeIdx,
    setActiveIdx,
    updateForText,
    dismiss,
    moveDown,
    moveUp,
    isOpen: filtered.length > 0,
  };
}
