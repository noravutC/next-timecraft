'use client';

import { useEffect } from 'react';
import { useProjectStore, useUserStore } from '@/store';
import { Loader } from '@/components/ui/loader';
import { CreateFirstProject } from './moveout/create-first-project';
import { ProjectHeader } from './project-header';
import { BoardDialogs } from '@/components/board-dialogs/board-dialogs';
import { TaskDetailSheet } from '@/components/task-detail/task-detail-sheet';

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const projects = useProjectStore((s) => s.projects);
  const status = useProjectStore((s) => s.status);
  const needCreateProject = useProjectStore((s) => s.needCreateProject);
  const fetchProjects = useProjectStore((s) => s.fetchProjects);
  const ensureActiveProject = useProjectStore((s) => s.ensureActiveProject);
  const fetchUsers = useUserStore((s) => s.fetchUsers);

  useEffect(() => {
    fetchProjects([], true)
      .then((fetched) =>
        fetchUsers(fetched.flatMap((p) => p.members.map((m) => m.userId))),
      )
      .catch(() => {});
  }, [fetchProjects, fetchUsers]);

  // keep the board the user is on (creating or renaming one used to jump
  // back to the first board)
  useEffect(() => {
    if (!needCreateProject) ensureActiveProject();
  }, [needCreateProject, projects, ensureActiveProject]);

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
