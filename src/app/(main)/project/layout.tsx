"use client";

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavStore, useProjectStore, useUserStore } from '@/store';
import LogoAnimationLoop from '@/components/logo-space/logo-animation-loop';
import { CreateFirstProject } from './moveout/create-first-project';
import { ProjectHeader } from './project-header';
import { ProjectSettingsPanel } from './settings/project-settings-panel';
import { BottomBarProject } from '@/components/bottom-menu/bottom-bar-project';

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { projects, status, needCreateProject, setProjectIsUsing, fetchProjects } =
    useProjectStore();
  const { fetchUsers } = useUserStore();
  const { view } = useNavStore();

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
    <div className="relative flex h-full w-full max-w-full flex-col overflow-x-hidden">
      <BottomBarProject />
      {needCreateProject ? (
        <CreateFirstProject />
      ) : (
        <>
          <ProjectHeader />
          <div className="flex min-h-0 flex-1 overflow-hidden">
            {/* Settings panel slides in from the LEFT, pushes board right */}
            <AnimatePresence initial={false}>
              {view === 'settings' && (
                <motion.div
                  key="settings"
                  initial={{ width: 0 }}
                  animate={{ width: 500 }}
                  exit={{ width: 0 }}
                  transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                  className="shrink-0 overflow-hidden border-r "
                >
                  <div className="h-full max-w-[500px] w-full">
                    <ProjectSettingsPanel />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {/* Board takes remaining space */}
            <div className="min-w-0 flex-1 overflow-hidden">
              {status === 'fetching' ? (
                <div className="flex h-full w-full items-center justify-center">
                  <LogoAnimationLoop />
                </div>
              ) : (
                children
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
