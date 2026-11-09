'use client';

import { toast } from 'sonner';
import { useUndoStore, type UndoEntry } from '@/store/use-undo.store';
import { UndoToast, type UndoIcon } from './undo-toast';

const toastId = (id: number) => `undo-${id}`;

/**
 * Remembers how to take a change back (⌘Z), and says so in a toast with an
 * Undo button. `silent` changes (field edits) only join the ⌘Z stack.
 */
export function offerUndo(change: {
  icon: UndoIcon;
  title: string;
  /** shown in bold after the title: "Moved to **Done**" */
  emphasis?: string;
  detail?: string;
  undo: UndoEntry['undo'];
  undoneTitle: string;
  redo?: UndoEntry['redo'];
  silent?: boolean;
}): void {
  const id = useUndoStore.getState().push({
    undo: change.undo,
    undoneTitle: change.undoneTitle,
    redo: change.redo,
  });
  if (change.silent) return;
  toast.custom(
    () => (
      <UndoToast
        icon={change.icon}
        title={
          change.emphasis ? (
            <>
              {change.title} <strong>{change.emphasis}</strong>
            </>
          ) : (
            change.title
          )
        }
        detail={change.detail}
        showShortcut
        action={{ label: 'Undo', onClick: () => void runUndo(id) }}
      />
    ),
    { id: toastId(id), duration: 6000 },
  );
}

/** Takes back that change, or the latest one (⌘Z). */
export async function runUndo(id?: number): Promise<void> {
  const entry = useUndoStore.getState().take(id);
  if (!entry) return;
  toast.dismiss(toastId(entry.id));
  try {
    await entry.undo();
  } catch {
    toast.error('Couldn’t undo that');
    return;
  }
  const doneId = `undone-${entry.id}`;
  toast.custom(
    () => (
      <UndoToast
        icon="done"
        title={entry.undoneTitle}
        action={
          entry.redo && {
            label: entry.redo.label,
            onClick: () => {
              toast.dismiss(doneId);
              entry.redo?.run().catch(() => toast.error('Couldn’t redo that'));
            },
          }
        }
      />
    ),
    { id: doneId, duration: 4000 },
  );
}
