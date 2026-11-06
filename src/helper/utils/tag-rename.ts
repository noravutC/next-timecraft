/** Saved tag name → its new name. Applied all at once, so swaps work. */
export type TagRenames = Record<string, string>;

/** A task's tags with every rename applied, duplicates dropped. */
export const renameTagsIn = (tags: string[], renames: TagRenames): string[] => {
  const out: string[] = [];
  for (const tag of tags) {
    const next = Object.hasOwn(renames, tag) ? renames[tag] : tag;
    if (!out.includes(next)) out.push(next);
  }
  return out;
};

export const hasTagRenames = (renames: TagRenames) =>
  Object.keys(renames).length > 0;

/** The saved name behind a tag as it reads now, or null for a new tag. */
const savedNameOf = (renames: TagRenames, saved: string[], current: string) =>
  Object.keys(renames).find((from) => renames[from] === current) ??
  (saved.includes(current) && !Object.hasOwn(renames, current)
    ? current
    : null);

/**
 * Notes that the tag now called `current` is renamed to `next`. A tag added
 * since the last save has no tasks yet, so it needs no entry; renaming back
 * to the saved name drops the entry.
 */
export const recordTagRename = (
  renames: TagRenames,
  saved: string[],
  current: string,
  next: string,
): TagRenames => {
  const from = savedNameOf(renames, saved, current);
  if (from === null) return renames;
  const out = { ...renames };
  if (next === from) delete out[from];
  else out[from] = next;
  return out;
};

/** A removed tag is no longer renamed: its tasks keep the saved name. */
export const dropTagRename = (
  renames: TagRenames,
  current: string,
): TagRenames => {
  const from = Object.keys(renames).find((k) => renames[k] === current);
  if (from === undefined) return renames;
  const out = { ...renames };
  delete out[from];
  return out;
};
