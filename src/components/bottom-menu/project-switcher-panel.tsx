'use client';

import { useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Archive, Columns3, Folder, Plus, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProjectStore } from '@/store';
import { useColumnStore } from '@/store/use-column.store';
import { useOrganizationStore } from '@/store/use-organization.store';
import { useUserStore } from '@/store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { ProjectCache } from '@/types';
import { withSettingsDefaults } from '@/types/project-settings';
import { ICON_OPTIONS } from '@/app/(main)/project/settings/_lib/constants';

interface ProjectSwitcherPanelProps {
  open: boolean;
  onClose: () => void;
}

export const ProjectSwitcherPanel = ({
  open,
  onClose,
}: ProjectSwitcherPanelProps) => {
  const { projects, projectIsUsing, setProjectIsUsing, setNeedCreateProject } =
    useProjectStore();
  const { organization } = useOrganizationStore();

  const projectList = Object.values(projects);
  const activeProject = projectIsUsing ? projects[projectIsUsing] : null;
  const orgName = organization?.name ?? 'My workspace';
  const orgInitial = orgName.charAt(0).toUpperCase();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close project switcher"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            onClick={onClose}
            className="fixed inset-0 z-40 cursor-default"
          />
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute right-0 bottom-20 left-0 z-50 mx-auto w-fit"
          >
            <div className="flex h-[520px] overflow-hidden rounded-2xl border border-gray-200 bg-background shadow-2xl">
              <OrgRail orgName={orgName} orgInitial={orgInitial} />

              <ProjectsColumn
                orgName={orgName}
                projects={projectList}
                activeProjectId={projectIsUsing}
                onSelect={(id) => setProjectIsUsing(id)}
                onCreate={() => {
                  setNeedCreateProject(true);
                  onClose();
                }}
              />

              <ProjectDetailsColumn project={activeProject} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ─── Project avatar (icon emoji or coverImage, tinted by settings.color) ──

const ProjectAvatar = ({
  project,
  size,
  rounded,
}: {
  project: ProjectCache;
  size: string;
  rounded: string;
}) => {
  const settings = withSettingsDefaults(project.settings);
  const iconOption = ICON_OPTIONS.find((i) => i.id === settings.icon);
  const tint = settings.color;

  return (
    <Avatar
      className={cn('shrink-0', size, rounded)}
      style={{ backgroundColor: `${tint}1a` }}
    >
      {project.coverImage && (
        <AvatarImage src={project.coverImage} alt={project.name} />
      )}
      <AvatarFallback
        className={cn('text-base', rounded)}
        style={{ backgroundColor: `${tint}1a`, color: tint }}
      >
        {iconOption ? (
          <span aria-hidden="true">{iconOption.emoji}</span>
        ) : (
          <Folder className="size-4" />
        )}
      </AvatarFallback>
    </Avatar>
  );
};

// ─── Left rail ─────────────────────────────────────────────────────────────

const OrgRail = ({
  orgName,
  orgInitial,
}: {
  orgName: string;
  orgInitial: string;
}) => (
  <div className="flex w-14 flex-col items-center gap-2 border-r border-gray-200 bg-muted/30 py-4">
    <Avatar className="size-9 rounded-xl" aria-label={orgName}>
      <AvatarFallback className="rounded-xl bg-foreground text-xs font-semibold text-background">
        {orgInitial}
      </AvatarFallback>
    </Avatar>
  </div>
);

// ─── Middle column ─────────────────────────────────────────────────────────

const ProjectsColumn = ({
  orgName,
  projects,
  activeProjectId,
  onSelect,
  onCreate,
}: {
  orgName: string;
  projects: ProjectCache[];
  activeProjectId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
}) => (
  <div className="flex w-64 flex-col border-r border-gray-200 bg-background">
    <header className="border-b border-gray-200 px-4 py-3">
      <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
        {orgName}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {projects.length} {projects.length === 1 ? 'project' : 'projects'}
      </p>
    </header>
    <div className="flex-1 space-y-1 overflow-y-auto p-2 [overflow-anchor:none] [scrollbar-color:theme(colors.gray.400)_theme(colors.gray.50)] [scrollbar-width:thin]">
      {projects.length === 0 ? (
        <p className="px-2 py-3 text-xs text-muted-foreground">
          No projects yet
        </p>
      ) : (
        projects.map((project) => {
          const isActive = activeProjectId === project.id;
          return (
            <button
              key={project.id}
              type="button"
              onClick={() => onSelect(project.id)}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors',
                isActive
                  ? 'bg-muted ring-1 ring-border'
                  : 'hover:bg-muted/60',
              )}
            >
              <ProjectAvatar
                project={project}
                size="size-8"
                rounded="rounded-lg"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {project.name}
                </p>
                {project.description && (
                  <p className="truncate text-xs text-muted-foreground">
                    {project.description}
                  </p>
                )}
              </div>
              {project.archived && (
                <Archive className="size-3.5 shrink-0 text-muted-foreground" />
              )}
            </button>
          );
        })
      )}
      <button
        type="button"
        onClick={onCreate}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
      >
        <Plus className="size-3.5" />
        New project
      </button>
    </div>
  </div>
);

// ─── Right column: project details ─────────────────────────────────────────

const ProjectDetailsColumn = ({
  project,
}: {
  project: ProjectCache | null;
}) => {
  const columns = useColumnStore((s) => s.columns);
  const users = useUserStore((s) => s.users);

  const columnCount = useMemo(() => {
    if (!project) return 0;
    return Object.values(columns).filter(
      (c) => c.projectId === project.id && !c.isDeleted,
    ).length;
  }, [columns, project]);

  if (!project) {
    return (
      <div className="flex w-80 items-center justify-center bg-background p-6 text-sm text-muted-foreground">
        Pick a project on the left
      </div>
    );
  }

  const members = project.members ?? [];

  return (
    <div className="flex w-80 flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-gray-200 px-4 py-4">
        <ProjectAvatar project={project} size="size-10" rounded="rounded-lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {project.name}
          </p>
          <div className="mt-1 flex items-center gap-1.5">
            <span
              className={cn(
                'size-1.5 rounded-full',
                project.archived ? 'bg-muted-foreground' : 'bg-emerald-500',
              )}
            />
            <span className="text-xs font-medium text-muted-foreground">
              {project.archived ? 'Archived' : 'Active'}
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto [overflow-anchor:none] [scrollbar-color:theme(colors.gray.400)_theme(colors.gray.50)] [scrollbar-width:thin]">
        {project.description && (
          <div className="border-b border-gray-200 px-4 py-3">
            <p className="text-xs leading-relaxed text-muted-foreground">
              {project.description}
            </p>
          </div>
        )}

        <div className="space-y-2.5 border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Columns3 className="size-3.5" />
              Columns
            </span>
            <span className="text-sm font-semibold text-foreground">
              {columnCount}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Users className="size-3.5" />
              Members
            </span>
            <div className="flex items-center gap-2">
              {members.length > 0 && (
                <div className="flex -space-x-1.5">
                  {members.slice(0, 4).map((m) => {
                    const u = users[m.userId];
                    const name = u?.fullName ?? '';
                    return (
                      <Avatar
                        key={m.userId}
                        className="size-5 ring-2 ring-background"
                      >
                        <AvatarImage src={u?.avatar ?? ''} alt={name} />
                        <AvatarFallback className="text-[9px] font-semibold">
                          {name.charAt(0).toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                    );
                  })}
                  {members.length > 4 && (
                    <span className="flex size-5 items-center justify-center rounded-full bg-muted text-[9px] font-semibold text-muted-foreground ring-2 ring-background">
                      +{members.length - 4}
                    </span>
                  )}
                </div>
              )}
              <span className="text-sm font-semibold text-foreground">
                {members.length}
              </span>
            </div>
          </div>
        </div>

        <div className="px-4 py-3">
          <p className="mb-2 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            Tags
          </p>
          {project.tags && project.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-xs text-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No tags</p>
          )}
        </div>
      </div>
    </div>
  );
};
