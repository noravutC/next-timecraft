import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { generateFractionBetween } from '@/helper/utils/fraction-string-indexing';
import {
  isCardDropTargetData,
  isColumnData,
  type TBoardState,
  type TCard,
  type TColumn,
} from './data';

type DropData = Record<string | symbol, unknown>;

export type MoveCardResult = {
  nextBoard: TBoardState;
  movedCard: TCard;
  toColumnId: string;
};

export type MoveColumnResult = {
  nextBoard: TBoardState;
  movedColumn: TColumn;
};

const rebuildTaskPositions = (
  taskPosById: TBoardState['taskPosById'],
  columnId: string,
  taskIds: string[],
) => {
  taskIds.forEach((taskId, index) => {
    taskPosById[taskId] = { columnId, index };
  });
};

const rebuildColumnPositions = (columnOrder: string[]) => {
  const columnPosById: Record<string, number> = {};
  columnOrder.forEach((columnId, index) => {
    columnPosById[columnId] = index;
  });
  return columnPosById;
};

// O(1) lookup by id/position maps; only touched columns are rebuilt.
export const moveCardWithFraction = (
  board: TBoardState,
  dragging: { card: TCard; columnId: string },
  dropData: DropData,
): MoveCardResult | null => {
  const taskId = dragging.card.id;
  const sourcePos = board.taskPosById[taskId];
  if (!sourcePos) return null;

  const sourceColumnId = sourcePos.columnId;
  const sourceIndex = sourcePos.index;
  const sourceOrder = board.taskOrderByColumnId[sourceColumnId];
  if (!sourceOrder) return null;

  let destinationColumnId = '';
  let insertIndex = -1;

  if (isCardDropTargetData(dropData)) {
    const targetPos = board.taskPosById[dropData.card.id];
    if (!targetPos) return null;

    const edge = extractClosestEdge(dropData);
    if (!edge) return null;

    destinationColumnId = targetPos.columnId;
    insertIndex = edge === 'bottom' ? targetPos.index + 1 : targetPos.index;
  } else if (isColumnData(dropData)) {
    destinationColumnId = dropData.column.id;
    insertIndex = (board.taskOrderByColumnId[destinationColumnId] ?? []).length;
  } else {
    return null;
  }

  if (!destinationColumnId) return null;

  let finalIndex = insertIndex;
  if (sourceColumnId === destinationColumnId && sourceIndex < insertIndex) {
    finalIndex -= 1;
  }
  if (sourceColumnId === destinationColumnId && finalIndex === sourceIndex) {
    return null;
  }

  const nextTaskOrderByColumnId = { ...board.taskOrderByColumnId };
  const nextSourceOrder = [...sourceOrder];
  nextSourceOrder.splice(sourceIndex, 1);

  const nextDestinationOrder =
    sourceColumnId === destinationColumnId
      ? nextSourceOrder
      : [...(board.taskOrderByColumnId[destinationColumnId] ?? [])];
  nextDestinationOrder.splice(finalIndex, 0, taskId);

  nextTaskOrderByColumnId[sourceColumnId] = nextSourceOrder;
  nextTaskOrderByColumnId[destinationColumnId] = nextDestinationOrder;

  const prevTaskId = nextDestinationOrder[finalIndex - 1];
  const nextTaskId = nextDestinationOrder[finalIndex + 1];
  const prevOrder = prevTaskId ? board.tasksById[prevTaskId]?.orderFraction ?? null : null;
  const nextOrder = nextTaskId ? board.tasksById[nextTaskId]?.orderFraction ?? null : null;
  const orderFraction = generateFractionBetween(prevOrder, nextOrder);

  const currentTask = board.tasksById[taskId];
  if (!currentTask) return null;
  const movedCard: TCard = { ...currentTask, columnId: destinationColumnId, orderFraction };

  const nextTasksById = { ...board.tasksById, [taskId]: movedCard };
  const nextColumnsById = { ...board.columnsById };
  if (sourceColumnId !== destinationColumnId) {
    const sourceColumn = nextColumnsById[sourceColumnId];
    const destinationColumn = nextColumnsById[destinationColumnId];
    if (sourceColumn) {
      nextColumnsById[sourceColumnId] = {
        ...sourceColumn,
        totalTasks: Math.max(0, sourceColumn.totalTasks - 1),
      };
    }
    if (destinationColumn) {
      nextColumnsById[destinationColumnId] = {
        ...destinationColumn,
        totalTasks: destinationColumn.totalTasks + 1,
      };
    }
  }

  const nextTaskPosById = { ...board.taskPosById };
  rebuildTaskPositions(nextTaskPosById, sourceColumnId, nextSourceOrder);
  if (sourceColumnId !== destinationColumnId) {
    rebuildTaskPositions(nextTaskPosById, destinationColumnId, nextDestinationOrder);
  }

  return {
    nextBoard: {
      ...board,
      columnsById: nextColumnsById,
      taskOrderByColumnId: nextTaskOrderByColumnId,
      tasksById: nextTasksById,
      taskPosById: nextTaskPosById,
    },
    movedCard,
    toColumnId: destinationColumnId,
  };
};

// O(1) source/target index lookup via columnPosById.
export const moveColumnWithFraction = (
  board: TBoardState,
  dragging: { column: TColumn },
  dropData: DropData,
): MoveColumnResult | null => {
  if (!isColumnData(dropData)) return null;

  const sourceIndex = board.columnPosById[dragging.column.id];
  const destinationIndex = board.columnPosById[dropData.column.id];
  if (sourceIndex === undefined || destinationIndex === undefined || sourceIndex === destinationIndex) {
    return null;
  }

  const nextColumnOrder = [...board.columnOrder];
  const [movedColumnId] = nextColumnOrder.splice(sourceIndex, 1);
  if (!movedColumnId) return null;

  nextColumnOrder.splice(destinationIndex, 0, movedColumnId);
  const prevColumnId = nextColumnOrder[destinationIndex - 1];
  const nextColumnId = nextColumnOrder[destinationIndex + 1];
  const prevOrder = prevColumnId ? board.columnsById[prevColumnId]?.orderFraction ?? null : null;
  const nextOrder = nextColumnId ? board.columnsById[nextColumnId]?.orderFraction ?? null : null;
  const orderFraction = generateFractionBetween(prevOrder, nextOrder);

  const currentColumn = board.columnsById[movedColumnId];
  if (!currentColumn) return null;
  const movedColumn: TColumn = { ...currentColumn, orderFraction, cards: [] };
  const nextColumnsById = {
    ...board.columnsById,
    [movedColumnId]: { ...currentColumn, orderFraction },
  };

  return {
    nextBoard: {
      ...board,
      columnOrder: nextColumnOrder,
      columnPosById: rebuildColumnPositions(nextColumnOrder),
      columnsById: nextColumnsById,
    },
    movedColumn,
  };
};
