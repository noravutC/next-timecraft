type SwitcherBoard = { id: string; name: string };

/**
 * Boards for the ⌘K switcher: name contains the query (case-insensitive),
 * the current board first, everything else in its original order.
 */
export const orderBoardsForSwitcher = <T extends SwitcherBoard>(
  boards: T[],
  currentId: string | null,
  query: string,
): T[] => {
  const q = query.trim().toLowerCase();
  const matched = boards.filter((b) => !q || b.name.toLowerCase().includes(q));
  return [
    ...matched.filter((b) => b.id === currentId),
    ...matched.filter((b) => b.id !== currentId),
  ];
};

/**
 * Archived boards are read-only and kept out of the main list; the switcher
 * shows them in their own section.
 */
export const splitArchivedBoards = <T extends { archived?: boolean | null }>(
  boards: T[],
): { active: T[]; archived: T[] } => ({
  active: boards.filter((b) => !b.archived),
  archived: boards.filter((b) => Boolean(b.archived)),
});

/** "1 member", "4 members" */
export const memberCountLabel = (count: number): string =>
  `${count} ${count === 1 ? 'member' : 'members'}`;

/**
 * Palette actions matching the query. When nothing matches, every action
 * stays visible so "Create new board" is still one keystroke away.
 */
export const filterSwitcherActions = <T extends { label: string }>(
  actions: T[],
  query: string,
): T[] => {
  const q = query.trim().toLowerCase();
  if (!q) return actions;
  const matched = actions.filter((a) => a.label.toLowerCase().includes(q));
  return matched.length > 0 ? matched : actions;
};
