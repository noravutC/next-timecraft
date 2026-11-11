type BoardColumn = {
  id: string;
  isDone: boolean;
  orderFraction: string | null;
};

/**
 * Where "Mark as not done" puts a task: back where it came from, or else
 * the column just before Done, or else any other column. Null when Done is
 * the board's only column. `columns` are one board's.
 */
export const reopenColumnId = (
  columns: BoardColumn[],
  completedFromColumnId: string | null | undefined,
): string | null => {
  const open = columns
    .filter((c) => !c.isDone)
    .sort((a, b) =>
      (a.orderFraction ?? '') < (b.orderFraction ?? '') ? -1 : 1,
    );
  if (open.some((c) => c.id === completedFromColumnId)) {
    return completedFromColumnId ?? null;
  }
  const doneOrder = columns.find((c) => c.isDone)?.orderFraction ?? null;
  const before =
    doneOrder === null
      ? []
      : open.filter((c) => (c.orderFraction ?? '') < doneOrder);
  return (before.at(-1) ?? open[0])?.id ?? null;
};
