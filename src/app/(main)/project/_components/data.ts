import type { ColumnCache, TaskCache } from '@/types';

type UnknownRecord = Record<string, unknown>;

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

export type TColumnSnapshot = Omit<TColumn, 'cards'>;

export type TTaskPosition = {
  columnId: string;
  index: number;
};

export type TBoardState = {
  columnOrder: string[];
  columnsById: Record<string, TColumnSnapshot>;
  columnPosById: Record<string, number>;
  taskOrderByColumnId: Record<string, string[]>;
  tasksById: Record<string, TCard>;
  taskPosById: Record<string, TTaskPosition>;
};

const asRecord = (value: unknown): UnknownRecord | null =>
  value && typeof value === 'object' ? (value as UnknownRecord) : null;

const resolveRow = (value: unknown, keys: string[]): UnknownRecord | null => {
  const record = asRecord(value);
  if (!record) return null;

  for (const key of keys) {
    const nested = asRecord(record[key]);
    if (nested) return nested;
  }

  return record;
};

const readString = (value: unknown, fallback = '') =>
  typeof value === 'string' ? value : fallback;

const readNumber = (value: unknown, fallback = 0) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const byOrderFraction = (
  a: { orderFraction?: string | null },
  b: { orderFraction?: string | null },
) => readString(a.orderFraction).localeCompare(readString(b.orderFraction));

export const createEmptyBoardState = (): TBoardState => ({
  columnOrder: [],
  columnsById: {},
  columnPosById: {},
  taskOrderByColumnId: {},
  tasksById: {},
  taskPosById: {},
});

const buildColumnPosById = (columnOrder: string[]): Record<string, number> => {
  const positions: Record<string, number> = {};
  columnOrder.forEach((columnId, index) => {
    positions[columnId] = index;
  });
  return positions;
};

const buildTaskPosById = (
  taskOrderByColumnId: Record<string, string[]>,
): Record<string, TTaskPosition> => {
  const positions: Record<string, TTaskPosition> = {};
  Object.entries(taskOrderByColumnId).forEach(([columnId, taskIds]) => {
    taskIds.forEach((taskId, index) => {
      positions[taskId] = { columnId, index };
    });
  });
  return positions;
};

const normalizeColumn = (value: unknown): ColumnCache | null => {
  const row = resolveRow(value, ['columns', 'column']);
  if (!row) return null;

  const id = readString(row.id ?? row._id);
  if (!id) return null;

  return {
    ...(row as unknown as ColumnCache),
    id,
    name: readString(row.name, 'Untitled'),
    projectId: readString(row.projectId),
    color: readString(row.color, '#CBD5E1'),
    wipLimit: readNumber(row.wipLimit),
    orderFraction: readString(row.orderFraction, '0'),
    timestamp: readNumber(row.timestamp, Date.now()),
  };
};

const normalizeTask = (value: unknown): TaskCache | null => {
  const row = resolveRow(value, ['tasks', 'task']);
  if (!row) return null;

  const id = readString(row.id ?? row._id);
  const columnId = readString(row.columnId);
  if (!id || !columnId) return null;

  return {
    ...(row as unknown as TaskCache),
    id,
    columnId,
    orderFraction: readString(row.orderFraction, '0'),
    timestamp: readNumber(row.timestamp, Date.now()),
  };
};

export function boardStateFromStoreData(
  columnsData: unknown[],
  tasksData: unknown[],
): TBoardState {
  const columns = columnsData.map(normalizeColumn).filter((column): column is ColumnCache => Boolean(column));
  const tasks = tasksData.map(normalizeTask).filter((task): task is TaskCache => Boolean(task));
  const sortedColumns = [...columns].sort(byOrderFraction);
  const columnOrder = sortedColumns.map((column) => column.id);
  const taskBucketsByColumn: Record<string, TCard[]> = {};
  const taskOrderByColumnId: Record<string, string[]> = {};
  const tasksById: Record<string, TCard> = {};
  const columnsById: Record<string, TColumnSnapshot> = {};

  sortedColumns.forEach((column) => {
    taskBucketsByColumn[column.id] = [];
    taskOrderByColumnId[column.id] = [];
    columnsById[column.id] = {
      id: column.id,
      title: column.name,
      color: column.color ?? undefined,
      wipLimit: readNumber(column.wipLimit),
      orderFraction: readString(column.orderFraction, '0'),
      totalTasks: readNumber((column as { totalTasks?: unknown }).totalTasks, 0),
    };
  });

  tasks.forEach((task) => {
    if (!columnsById[task.columnId]) return;
    taskBucketsByColumn[task.columnId].push({
      ...task,
      columnId: task.columnId,
      orderFraction: readString(task.orderFraction, '0'),
      description: task.description ?? task.title ?? '',
    });
  });

  Object.entries(taskBucketsByColumn).forEach(([columnId, cards]) => {
    cards.sort(byOrderFraction);
    taskOrderByColumnId[columnId] = cards.map((card) => {
      tasksById[card.id] = card;
      return card.id;
    });
    if (columnsById[columnId].totalTasks < cards.length) {
      columnsById[columnId].totalTasks = cards.length;
    }
  });

  return {
    columnOrder,
    columnsById,
    columnPosById: buildColumnPosById(columnOrder),
    taskOrderByColumnId,
    tasksById,
    taskPosById: buildTaskPosById(taskOrderByColumnId),
  };
}

export function boardViewFromState(state: TBoardState): TBoard {
  return {
    columns: state.columnOrder
      .map((columnId) => {
        const column = state.columnsById[columnId];
        if (!column) return null;
        const taskIds = state.taskOrderByColumnId[columnId] ?? [];
        const cards = taskIds
          .map((taskId) => state.tasksById[taskId])
          .filter((task): task is TCard => Boolean(task));
        return {
          ...column,
          cards,
        };
      })
      .filter((column): column is TColumn => Boolean(column)),
  };
}

export function boardFromStoreData(columnsData: unknown[], tasksData: unknown[]): TBoard {
  return boardViewFromState(boardStateFromStoreData(columnsData, tasksData));
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
