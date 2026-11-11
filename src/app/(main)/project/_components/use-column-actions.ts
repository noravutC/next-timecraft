'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { offerUndo } from '@/components/undo/offer-undo';
import { useColumnStore } from '@/store/use-column.store';
import { TASK_PAGE_SIZE, useTaskStore } from '@/store/use-task.store';
import type { UpdateColumnPayload } from '@/types';
import { shiftedColumnFraction } from './board-operations';
import type { TColumn } from './data';

/** Rename, recolor, WIP limit, Done flag, move and delete one column. */
export function useColumnActions(column: TColumn, allColumns: TColumn[]) {
  const patchColumn = useColumnStore((s) => s.patchColumn);
  const setDoneColumn = useColumnStore((s) => s.setDoneColumn);
  const deleteColumns = useColumnStore((s) => s.deleteColumns);
  const restoreColumns = useColumnStore((s) => s.restoreColumns);
  const fetchTasksByColumns = useTaskStore((s) => s.fetchTasksByColumns);
  const [renaming, setRenaming] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const patch = (change: Omit<UpdateColumnPayload, 'id'>, failure: string) =>
    patchColumn(column.id, change).catch(() => toast.error(failure));

  const rename = (raw: string) => {
    setRenaming(false);
    const name = raw.trim();
    if (name && name !== column.title) {
      void patch({ name }, 'Couldn’t rename the column');
    }
  };

  const move = (direction: -1 | 1) => {
    const orderFraction = shiftedColumnFraction(
      allColumns,
      column.id,
      direction,
    );
    if (orderFraction)
      void patch({ orderFraction }, 'Couldn’t move the column');
  };

  const restore = async () => {
    await restoreColumns([column.id]);
    await fetchTasksByColumns([column.id], TASK_PAGE_SIZE);
  };

  const remove = async () => {
    setConfirmDelete(false);
    try {
      await deleteColumns([column.id]);
      offerUndo({
        icon: 'trash',
        title: `Deleted the ${column.title} column`,
        undo: restore,
        undoneTitle: `${column.title} is back`,
      });
    } catch {
      toast.error('Couldn’t delete the column');
    }
  };

  const index = allColumns.findIndex((c) => c.id === column.id);

  return {
    renaming,
    startRename: () => setRenaming(true),
    cancelRename: () => setRenaming(false),
    rename,
    recolor: (color: string) =>
      void patch({ color }, 'Couldn’t change the color'),
    setWipLimit: (wipLimit: number) =>
      void patch({ wipLimit }, 'Couldn’t change the WIP limit'),
    setDone: (isDone: boolean) =>
      void setDoneColumn(column.id, isDone).catch(() =>
        toast.error('Couldn’t change the Done column'),
      ),
    canMoveLeft: index > 0,
    canMoveRight: index !== -1 && index < allColumns.length - 1,
    move,
    confirmDelete,
    setConfirmDelete,
    remove,
  };
}

export type ColumnActions = ReturnType<typeof useColumnActions>;
