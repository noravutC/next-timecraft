/** A search text, made literal for SQL LIKE (%, _ and \ lose their meaning). */
export const escapeLike = (query: string): string =>
  query.replace(/[\\%_]/g, (c) => `\\${c}`);

/** The text around the first match, cut at word edges: "…opens in Safari with…". */
export const snippetAround = (
  text: string,
  query: string,
  radius = 60,
): string => {
  const flat = text.replace(/\s+/g, ' ').trim();
  const at = flat.toLowerCase().indexOf(query.trim().toLowerCase());
  if (at === -1) return flat.slice(0, radius * 2);
  const start = Math.max(0, at - radius);
  const end = Math.min(flat.length, at + query.trim().length + radius);
  let piece = flat.slice(start, end);
  if (start > 0) piece = `…${piece.replace(/^\S*\s/, '')}`;
  if (end < flat.length) piece = `${piece.replace(/\s\S*$/, '')}…`;
  return piece;
};

/** [before, match, after] of the first match, for highlighting; null if none. */
export const splitMatch = (
  text: string,
  query: string,
): [string, string, string] | null => {
  const q = query.trim();
  const at = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (at === -1) return null;
  return [
    text.slice(0, at),
    text.slice(at, at + q.length),
    text.slice(at + q.length),
  ];
};
