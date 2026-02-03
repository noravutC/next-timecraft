import type { ColumnMapTask } from '@/types/column-map';
import type { TaskCache } from '@/types/task';
import { color } from 'framer-motion';

export type TCard = TaskCache & {
  id: string;
  description: string;
};

export type TColumn = {
  id: ColumnMapTask['_id'];
  title: ColumnMapTask['name'];
  color?: string;
  totalTasks: number;
  cards: TCard[];
};

export type TBoard = {
  columns: TColumn[];
};

const byOrder = (a: { order?: number }, b: { order?: number }) => (a.order ?? 0) - (b.order ?? 0);

export function boardFromColumnMap(columnMap: Record<string, ColumnMapTask>): TBoard {
  const columns = Object.values(columnMap)
    .sort(byOrder)
    .map((column) => ({
      id: column._id,
      title: column.name,
      color: column.color,
      totalTasks: column.totalTasks,
      cards: Object.values(column.taskInColumn ?? {})
        .sort(byOrder)
        .map((task) => ({
          ...task,
          id: task._id,
          description: task.description ?? task.title ?? '',
        })),
    }));

  return { columns };
}

export function columnMapFromBoard(
  board: TBoard,
  prev: Record<string, ColumnMapTask>,
): Record<string, ColumnMapTask> {
  const next: Record<string, ColumnMapTask> = { ...prev };

  board.columns.forEach((column, columnIndex) => {
    const prevColumn = prev[column.id];
    if (!prevColumn) {
      return;
    }

    const taskInColumn: Record<string, TaskCache> = {};
    column.cards.forEach((card, index) => {
      taskInColumn[card.id] = {
        ...card,
        columnId: column.id,
        order: index,
      };
    });

    next[column.id] = {
      ...prevColumn,
      name: column.title ?? prevColumn.name,
      order: columnIndex,
      totalTasks: column.totalTasks,
      taskInColumn,
    };
  });

  return next;
}

const cardKey = Symbol('card');
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
}: Omit<TCardData, typeof cardKey> & { columnId: string }): TCardData {
  return {
    [cardKey]: true,
    rect,
    card,
    columnId,
  };
}

export function isCardData(value: Record<string | symbol, unknown>): value is TCardData {
  return Boolean(value[cardKey]);
}

export function isDraggingACard({
  source,
}: {
  source: { data: Record<string | symbol, unknown> };
}): boolean {
  return isCardData(source.data);
}

const cardDropTargetKey = Symbol('card-drop-target');
export type TCardDropTargetData = {
  [cardDropTargetKey]: true;
  card: TCard;
  columnId: string;
};

export function isCardDropTargetData(
  value: Record<string | symbol, unknown>,
): value is TCardDropTargetData {
  return Boolean(value[cardDropTargetKey]);
}

export function getCardDropTargetData({
  card,
  columnId,
}: Omit<TCardDropTargetData, typeof cardDropTargetKey> & {
  columnId: string;
}): TCardDropTargetData {
  return {
    [cardDropTargetKey]: true,
    card,
    columnId,
  };
}

const columnKey = Symbol('column');
export type TColumnData = {
  [columnKey]: true;
  column: TColumn;
};

export function getColumnData({ column }: Omit<TColumnData, typeof columnKey>): TColumnData {
  return {
    [columnKey]: true,
    column,
  };
}

export function isColumnData(value: Record<string | symbol, unknown>): value is TColumnData {
  return Boolean(value[columnKey]);
}

export function isDraggingAColumn({
  source,
}: {
  source: { data: Record<string | symbol, unknown> };
}): boolean {
  return isColumnData(source.data);
}
