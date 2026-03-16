import { extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { generateFractionBetween } from "@/helper/utils/fraction-string-indexing";
import {
  isCardDropTargetData,
  isColumnData,
  type TCard,
  type TColumn,
} from "./data";

type DropData = Record<string | symbol, unknown>;

export type CardMoveResult = {
  taskId: string;
  fromColumnId: string;
  toColumnId: string;
  newOrderFraction: string;
};

export type ColumnMoveResult = {
  columnId: string;
  newOrderFraction: string;
};

/**
 * Computes where a card lands and what its new orderFraction should be.
 * Works directly with the sorted TColumn[] from the derived board view.
 */
export const computeCardMove = (
  columns: TColumn[],
  dragging: { card: TCard; columnId: string },
  dropData: DropData,
): CardMoveResult | null => {
  const sourceCol = columns.find((c) => c.id === dragging.columnId);
  if (!sourceCol) return null;
  const sourceIndex = sourceCol.cards.findIndex(
    (c) => c.id === dragging.card.id,
  );
  if (sourceIndex === -1) return null;

  let destinationColumnId = "";
  let insertIndex = -1;

  if (isCardDropTargetData(dropData)) {
    const edge = extractClosestEdge(dropData);
    if (!edge) return null;
    const destCol = columns.find((c) => c.id === dropData.columnId);
    if (!destCol) return null;
    const cardIdx = destCol.cards.findIndex((c) => c.id === dropData.card.id);
    if (cardIdx === -1) return null;
    destinationColumnId = destCol.id;
    insertIndex = edge === "bottom" ? cardIdx + 1 : cardIdx;
  } else if (isColumnData(dropData)) {
    destinationColumnId = dropData.column.id;
    insertIndex =
      columns.find((c) => c.id === destinationColumnId)?.cards.length ?? 0;
  } else {
    return null;
  }

  // Adjust for same-column move
  let finalIndex = insertIndex;
  if (dragging.columnId === destinationColumnId) {
    if (sourceIndex < insertIndex) finalIndex -= 1;
    if (finalIndex === sourceIndex) return null; // no-op
  }

  const destCol = columns.find((c) => c.id === destinationColumnId)!;
  // Neighbor cards: for same-column, exclude the dragged card first
  const neighborCards =
    dragging.columnId === destinationColumnId
      ? destCol.cards.filter((c) => c.id !== dragging.card.id)
      : destCol.cards;

  const prevOrder = neighborCards[finalIndex - 1]?.orderFraction ?? null;
  const nextOrder = neighborCards[finalIndex]?.orderFraction ?? null;

  return {
    taskId: dragging.card.id,
    fromColumnId: dragging.columnId,
    toColumnId: destinationColumnId,
    newOrderFraction: generateFractionBetween(prevOrder, nextOrder),
  };
};

/**
 * Computes a column's new orderFraction after being dropped to a new position.
 */
export const computeColumnMove = (
  columns: TColumn[],
  dragging: { column: TColumn },
  dropData: DropData,
): ColumnMoveResult | null => {
  if (!isColumnData(dropData)) return null;

  const sourceIdx = columns.findIndex((c) => c.id === dragging.column.id);
  const destIdx = columns.findIndex((c) => c.id === dropData.column.id);
  if (sourceIdx === -1 || destIdx === -1 || sourceIdx === destIdx) return null;

  // Simulate the reorder
  const newOrder = columns.map((c) => c.id);
  newOrder.splice(sourceIdx, 1);
  newOrder.splice(destIdx, 0, dragging.column.id);

  const prevOrder = newOrder[destIdx - 1]
    ? (columns.find((c) => c.id === newOrder[destIdx - 1])?.orderFraction ??
      null)
    : null;
  const nextOrder = newOrder[destIdx + 1]
    ? (columns.find((c) => c.id === newOrder[destIdx + 1])?.orderFraction ??
      null)
    : null;

  return {
    columnId: dragging.column.id,
    newOrderFraction: generateFractionBetween(prevOrder, nextOrder),
  };
};
