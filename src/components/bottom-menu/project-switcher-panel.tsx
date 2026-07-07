'use client';

import { useMemo, useState } from 'react';
import { Archive, ArrowLeftRight, Plus, Search, Users, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProjectStore } from '@/store';
import { useOrganizationStore } from '@/store/use-organization.store';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ProjectAvatar } from '@/components/project/project-avatar';
import type { ProjectCache } from '@/types';

interface ProjectSwitcherPanelProps {
  open: boolean;
  onClose: () => void;
  onCreateNew: () => void;
}

export const ProjectSwitcherPanel = ({
  open,
  onClose,
  onCreateNew,
}: ProjectSwitcherPanelProps) => {
  const { projects, projectIsUsing, setProjectIsUsing } = useProjectStore();
  const { organization } = useOrganizationStore();

  const orgName = organization?.name ?? 'your workspace';
  const [query, setQuery] = useState('');

  // เปิด dialog ใหม่ทุกครั้งให้เริ่มค้นจากหน้าว่าง (adjust-state-on-prop-change,
  // ไม่ใช้ effect เพื่อเลี่ยง cascading render)
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setQuery('');
  }

  // เรียง board ปัจจุบันขึ้นก่อนเสมอ แล้วค่อยตามด้วยตัวอื่นตามลำดับเดิม
  const projectList = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = Object.values(projects).filter(
      (p) => !q || p.name.toLowerCase().includes(q),
    );
    return [
      ...matched.filter((p) => p.id === projectIsUsing),
      ...matched.filter((p) => p.id !== projectIsUsing),
    ];
  }, [projects, projectIsUsing, query]);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[560px] flex-col gap-0 rounded-2xl p-0 sm:max-w-2xl"
      >
        <DialogHeader className="flex-row items-center gap-3 space-y-0 border-b px-6 py-4 text-left">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft">
            <ArrowLeftRight className="size-5 text-brand" />
          </div>
          <div className="min-w-0">
            <DialogTitle className="text-lg font-semibold text-ink">
              Switch Boards
            </DialogTitle>
            <DialogDescription className="text-sm text-ink-subtle">
              Jump to another board in {orgName}
            </DialogDescription>
          </div>
          <DialogClose className="ml-auto flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-surface text-ink-muted transition-colors hover:bg-surface-active hover:text-ink">
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>

        <div className="px-6 pt-5 pb-4">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-faint" />
            <Input
              inputSize="md"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search boards…"
              className="rounded-lg border-line bg-surface pl-9 text-sm shadow-none placeholder:text-ink-faint focus-visible:bg-white"
            />
          </div>
        </div>

        <div className="scrollbar-thin-y scrollbar-light grid min-h-0 flex-1 grid-cols-2 content-start gap-3 overflow-y-auto px-6 pb-6 [overflow-anchor:none]">
          {projectList.length === 0 ? (
            <p className="col-span-2 py-8 text-center text-sm text-ink-subtle">
              No boards match “{query}”
            </p>
          ) : (
            projectList.map((project) => (
              <BoardCard
                key={project.id}
                project={project}
                isActive={project.id === projectIsUsing}
                onSelect={() => {
                  setProjectIsUsing(project.id);
                  onClose();
                }}
              />
            ))
          )}
          <button
            type="button"
            onClick={onCreateNew}
            className="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-ink-faint/40 text-sm font-medium text-ink-subtle transition-colors hover:border-brand-line hover:bg-brand-soft/30 hover:text-brand"
          >
            <Plus className="size-5" />
            New board
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const BoardCard = ({
  project,
  isActive,
  onSelect,
}: {
  project: ProjectCache;
  isActive: boolean;
  onSelect: () => void;
}) => {
  const memberCount = project.members?.length ?? 0;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex cursor-pointer flex-col gap-3 rounded-xl border p-4 text-left transition-colors',
        isActive
          ? 'border-brand-line bg-brand-soft/40'
          : 'border-line bg-white hover:border-brand-line hover:bg-surface',
      )}
    >
      <div className="flex w-full items-start justify-between">
        <ProjectAvatar project={project} size="size-11" rounded="rounded-xl" />
        {isActive && (
          <span className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-ink-muted shadow-[0_1px_2px_rgba(20,22,35,0.06)]">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Current
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-ink">
          {project.name}
        </p>
        <div className="mt-1.5 flex items-center gap-3 text-xs text-ink-subtle">
          <span className="flex items-center gap-1">
            <Users className="size-3.5" />
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </span>
          {project.archived && (
            <span className="flex items-center gap-1">
              <Archive className="size-3.5" />
              Archived
            </span>
          )}
        </div>
      </div>
    </button>
  );
};
