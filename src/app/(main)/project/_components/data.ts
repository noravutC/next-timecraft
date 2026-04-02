import type { ColumnCache, TaskCache } from "@/types";

// ─── View types (for rendering) ───────────────────────────────────────────────

export type TCard = TaskCache & {
  description: string;
  orderFraction: string;
  columnId: string;
};

export type TColumn = {
  id: string;
  title: string;
  color?: string;
  wipLimit: number;
  orderFraction: string;
  totalTasks: number;
  cards: TCard[];
};

export type TBoard = {
  columns: TColumn[];
};

// ─── Pending DnD move (optimistic UI) ─────────────────────────────────────────

export type PendingMove =
  | {
      type: "card";
      taskId: string;
      fromColumnId: string;
      toColumnId: string;
      newOrderFraction: string;
    }
  | { type: "column"; columnId: string; newOrderFraction: string };

// ─── Board derivation ─────────────────────────────────────────────────────────

const byOrderFraction = (
  a: { orderFraction?: string | null },
  b: { orderFraction?: string | null },
) => {
  const av = a.orderFraction ?? "";
  const bv = b.orderFraction ?? "";
  return av < bv ? -1 : av > bv ? 1 : 0;
};

/**
 * Derives the board view directly from store data + any in-flight DnD change.
 * No local state copy — store is the single source of truth.
 */
export function deriveBoardView(
  columnsMap: Record<string, ColumnCache>,
  tasksMap: Record<string, TaskCache>,
  projectId: string | null,
  pendingMove: PendingMove | null,
): TBoard {
  // 1. Sorted columns for this project, with pending column order applied
  const projectCols = Object.values(columnsMap)
    .filter((col) => col.projectId === projectId)
    .map((col) => ({
      ...col,
      orderFraction:
        pendingMove?.type === "column" && pendingMove.columnId === col.id
          ? pendingMove.newOrderFraction
          : (col.orderFraction ?? "0"),
    }))
    .sort(byOrderFraction);

  // 2. Bucket tasks by column — skip the card that is being moved
  const buckets: Record<string, TCard[]> = Object.fromEntries(
    projectCols.map((c) => [c.id, []]),
  );

  for (const task of Object.values(tasksMap)) {
    if (!buckets[task.columnId]) continue;
    if (task.archived) continue;
    if (pendingMove?.type === "card" && task.id === pendingMove.taskId)
      continue;
    buckets[task.columnId].push({
      ...task,
      description: task.description ?? task.title ?? "",
      orderFraction: task.orderFraction ?? "0",
    });
  }

  // 3. Insert pending card into its destination column
  if (pendingMove?.type === "card") {
    const orig = tasksMap[pendingMove.taskId];
    if (orig && buckets[pendingMove.toColumnId]) {
      buckets[pendingMove.toColumnId].push({
        ...orig,
        columnId: pendingMove.toColumnId,
        orderFraction: pendingMove.newOrderFraction,
        description: orig.description ?? orig.title ?? "",
      });
    }
  }

  // 4. Build final TColumn array with sorted cards
  return {
    columns: projectCols.map((col) => {
      const cards = (buckets[col.id] ?? []).sort(byOrderFraction);
      return {
        id: col.id,
        title: col.name,
        color: col.color ?? undefined,
        wipLimit: col.wipLimit ?? 0,
        orderFraction: col.orderFraction,
        totalTasks: cards.length,
        cards,
      };
    }),
  };
}

// ─── DnD data types & guards ──────────────────────────────────────────────────

type UnknownRecord = Record<string | symbol, unknown>;

const cardKey = Symbol("card");
export type TCardData = {
  [cardKey]: true;
  card: TCard;
  columnId: string;
  rect: DOMRect;
};

export function getCardData({
  card,
  rect,
  columnId,
}: Omit<TCardData, typeof cardKey>): TCardData {
  return { [cardKey]: true, rect, card, columnId };
}
export function isCardData(value: UnknownRecord): value is TCardData {
  return Boolean(value[cardKey]);
}
export function isDraggingACard({
  source,
}: {
  source: { data: UnknownRecord };
}): boolean {
  return isCardData(source.data);
}

const cardDropTargetKey = Symbol("card-drop-target");
export type TCardDropTargetData = {
  [cardDropTargetKey]: true;
  card: TCard;
  columnId: string;
};

export function getCardDropTargetData({
  card,
  columnId,
}: Omit<TCardDropTargetData, typeof cardDropTargetKey>): TCardDropTargetData {
  return { [cardDropTargetKey]: true, card, columnId };
}
export function isCardDropTargetData(
  value: UnknownRecord,
): value is TCardDropTargetData {
  return Boolean(value[cardDropTargetKey]);
}

const columnKey = Symbol("column");
export type TColumnData = { [columnKey]: true; column: TColumn };

export function getColumnData({
  column,
}: Omit<TColumnData, typeof columnKey>): TColumnData {
  return { [columnKey]: true, column };
}
export function isColumnData(value: UnknownRecord): value is TColumnData {
  return Boolean(value[columnKey]);
}
export function isDraggingAColumn({
  source,
}: {
  source: { data: UnknownRecord };
}): boolean {
  return isColumnData(source.data);
}
