export type MentionTarget = { id: string; name: string };

export function detectMention(text: string, caret: number): string | null {
  const upto = text.slice(0, caret);
  const match = upto.match(/(?:^|\s)@([^\s@]*)$/);
  return match ? match[1] : null;
}

export function extractMentionIds(
  text: string,
  candidates: readonly MentionTarget[],
): string[] {
  const ids = new Set<string>();
  for (const c of candidates) {
    const re = new RegExp(
      `@${c.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=\\s|$)`,
    );
    if (re.test(text)) ids.add(c.id);
  }
  return Array.from(ids);
}

export function buildMentionInsertion(
  value: string,
  caret: number,
  name: string,
): { value: string; cursor: number } {
  const upto = value.slice(0, caret);
  const after = value.slice(caret);
  const replaced = upto.replace(/@([^\s@]*)$/, `@${name} `);
  return { value: replaced + after, cursor: replaced.length };
}
