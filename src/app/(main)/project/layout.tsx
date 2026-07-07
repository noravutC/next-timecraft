'use client';

import { useEffect } from 'react';
import { useProjectStore, useUserStore } from '@/store';
import { Loader } from '@/components/ui/loader';
import { CreateFirstProject } from './moveout/create-first-project';
import { ProjectHeader } from './project-header';
import { BottomBarProject } from '@/components/bottom-menu/bottom-bar-project';
import { TaskDetailDialog } from '@/components/task-detail/task-detail-dialog';

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    projects,
    status,
    needCreateProject,
    setProjectIsUsing,
    fetchProjects,
  } = useProjectStore();
  const { fetchUsers } = useUserStore();

  useEffect(() => {
    fetchProjects([], true).then((fetched) => {
      const userIds = [
        ...new Set(fetched.flatMap((p) => p.members.map((m) => m.userId))),
      ];
      if (userIds.length > 0) fetchUsers(userIds);
    });
  }, []);

  useEffect(() => {
    if (!needCreateProject && Object.keys(projects).length > 0) {
      setProjectIsUsing(Object.keys(projects)[0]);
    }
  }, [needCreateProject, projects]);

  return (
    <div className="relative flex h-full w-full max-w-full flex-col overflow-hidden">
      <BottomBarProject />
      {needCreateProject ? (
        <CreateFirstProject />
      ) : (
        <>
          <ProjectHeader />
          <div className="flex min-h-0 flex-1 overflow-hidden">
            {/* Board settings เปิดเป็น dialog จาก bottom bar — ไม่มี slide panel แล้ว */}
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
      <TaskDetailDialog />
    </div>
  );
}
