'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { organizationServices } from '@/services/organization.service';
import { projectServices } from '@/services/projects.service';
import { useProjectStore } from '@/store';
import type { ArchivedBoard } from '@/types';

/** The workspace's archived boards you're on, and restoring them. */
export function useArchivedBoards(workspaceId: string) {
  const [boards, setBoards] = useState<ArchivedBoard[] | null>(null);
  const [restoredName, setRestoredName] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    organizationServices
      .getArchivedBoards(workspaceId)
      .then(({ data }) => alive && setBoards(data))
      .catch(() => alive && setBoards([]));
    return () => {
      alive = false;
    };
  }, [workspaceId]);

  // optimistic: the row leaves at once and comes back if the server refuses
  const restore = async (board: ArchivedBoard) => {
    const before = boards;
    setBoards((list) => list?.filter((b) => b.id !== board.id) ?? null);
    setRestoredName(board.name);
    try {
      const { projects, updateProject } = useProjectStore.getState();
      // the board list may not be loaded here: then only tell the server
      if (projects[board.id]) {
        await updateProject(board.id, { archived: false });
      } else {
        await projectServices.updateProject(board.id, { archived: false });
      }
    } catch (error) {
      setBoards(before);
      setRestoredName(null);
      toast.error(
        (error as { message?: string })?.message ??
          `Couldn’t restore ${board.name}`,
      );
    }
  };

  return { boards, restoredName, restore };
}
