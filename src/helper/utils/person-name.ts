/** "Noravut Chaiyasit" → "NC", "Ploy" → "P", empty → "?" */
export const initialsOf = (
  name: string | null | undefined,
  max = 2,
): string => {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : '';
  return (first + last).slice(0, max).toUpperCase();
};

/** What a deleted account is called wherever its name used to be. */
export const FORMER_MEMBER = 'Former member';

/** "Noravut Chaiyasit" → "Noravut C.", "Ploy" → "Ploy" */
export const shortName = (name: string | null | undefined): string => {
  if (name === FORMER_MEMBER) return name;
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  if (words.length === 1) return words[0];
  return `${words[0]} ${words[words.length - 1][0].toUpperCase()}.`;
};
