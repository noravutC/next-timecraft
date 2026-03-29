// project/project-tools-layout.tsx
'use client';

import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavStore, useProjectStore, useUserStore } from '@/store';
import LogoAnimationLoop from '@/components/logo-space/logo-animation-loop';
import { CreateFirstProject } from './moveout/create-first-project';
import { ProjectHeader } from './project-header';
import { ProjectSettingsPanel } from './settings/project-settings-panel';
import { BottomBarProject } from '../../../components/bottom-menu/bottom-bar-project';

// ── Inner content — runs inside ProjectMenuProvider ──────────────

const ProjectInnerContent = ({ children }: { children: React.ReactNode }) => {
  const { projects, status, needCreateProject, setProjectIsUsing } =
    useProjectStore();
  const { view } = useNavStore();

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

          <div className="relative flex-1 overflow-hidden">
            {status === 'fetching' ? (
              <div className="flex h-full w-full items-center justify-center">
                <LogoAnimationLoop />
              </div>
            ) : (
              <AnimatePresence mode="wait" initial={false}>
                {view === 'board' ? (
                  <motion.div
                    key="board"
                    initial={{ x: '-8%', opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: '-8%', opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                    className="absolute inset-0"
                  >
                    {children}
                  </motion.div>
                ) : view === 'settings' ? (
                  <motion.div
                    key="settings"
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                    className="absolute inset-0 z-10"
                  >
                    <ProjectSettingsPanel />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ── Inner layout — fetches projects, provides ProjectMenuProvider ─

const ProjectInnerLayout = ({ children }: { children: React.ReactNode }) => {
  const { fetchProjects } = useProjectStore();
  const { fetchUsers } = useUserStore();

  useEffect(() => {
    fetchProjects([], true).then((projects) => {
      const userIds = [
        ...new Set(projects.flatMap((p) => p.members.map((m) => m.userId))),
      ];
      if (userIds.length > 0) fetchUsers(userIds);
    });
  }, []);

  return <ProjectInnerContent>{children}</ProjectInnerContent>;
};

// ── Public export ────────────────────────────────────────────────

export const ProjectToolsLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return <ProjectInnerLayout>{children}</ProjectInnerLayout>;
};
