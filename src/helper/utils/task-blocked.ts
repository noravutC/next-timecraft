type Blocker = { id: string; columnId: string; archived: boolean };
type LiveTask = { columnId: string; archived: boolean };

/**
 * Blocked while any blocker is still open: not archived and not in the
 * finishing column. The live copy of a blocker wins over the fetched one.
 */
export const isBlocked = (
  blockers: Blocker[] | undefined,
  live: Record<string, LiveTask | undefined>,
  finishColumnId: string | null,
): boolean =>
  (blockers ?? []).some((blocker) => {
    const now = live[blocker.id] ?? blocker;
    return !now.archived && now.columnId !== finishColumnId;
  });

/** The column work ends in: the board's Done column, if it has one. */
export const finishColumnOf = <
  T extends { id: string; projectId: string; isDone: boolean },
>(
  columns: T[],
  projectId: string | null,
): string | null =>
  columns.find((c) => c.projectId === projectId && c.isDone)?.id ?? null;
