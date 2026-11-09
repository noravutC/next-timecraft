'use client';

import { useEffect } from 'react';
import { useProjectStore, useUserStore } from '@/store';
import { Loader } from '@/components/ui/loader';
import { CreateFirstProject } from './moveout/create-first-project';
import { ProjectHeader } from './project-header';
import { BoardDialogs } from '@/components/board-dialogs/board-dialogs';
import { TaskDetailSheet } from '@/components/task-detail/task-detail-sheet';
import { useBoardUrlSync } from './_components/use-board-url-sync';
import { useUndoShortcut } from '@/components/undo/use-undo-shortcut';

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const status = useProjectStore((s) => s.status);
  const needCreateProject = useProjectStore((s) => s.needCreateProject);
  const fetchProjects = useProjectStore((s) => s.fetchProjects);
  const fetchUsers = useUserStore((s) => s.fetchUsers);
  // opens the board and task the URL names, and keeps the URL current
  useBoardUrlSync();
  // ⌘Z takes back the last move, archive or edit
  useUndoShortcut();

  useEffect(() => {
    fetchProjects([], true)
      .then((fetched) =>
        fetchUsers(fetched.flatMap((p) => p.members.map((m) => m.userId))),
      )
      .catch(() => {});
  }, [fetchProjects, fetchUsers]);

  return (
    <div className="relative flex h-full w-full max-w-full flex-col overflow-hidden">
      <BoardDialogs />
      {needCreateProject ? (
        <CreateFirstProject />
      ) : (
        <>
          <ProjectHeader />
          <div className="flex min-h-0 flex-1 overflow-hidden">
            <div className="min-w-0 flex-1 overflow-hidden">
              {status === 'fetching' ? (
                <div className="flex h-full w-full items-center justify-center">
                  <Loader size="lg" />
                </div>
              ) : (
                children
              )}
            </div>
          </div>
        </>
      )}
      <TaskDetailSheet />
    </div>
  );
}
