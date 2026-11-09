'use client';

import { CommandItem } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Kbd } from '@/components/ui/kbd';
import { ProjectAvatar } from '@/components/project/project-avatar';
import { memberCountLabel } from '@/helper/utils/board-switcher';
import { cn } from '@/lib/utils';
import type { ProjectCache } from '@/types';

/** One board row in the ⌘K palette: tile, name, state chips, member count. */
export const SwitcherBoardItem = ({
  project,
  isCurrent,
  onSelect,
  className,
}: {
  project: ProjectCache;
  isCurrent: boolean;
  onSelect: () => void;
  className?: string;
}) => (
  <CommandItem
    value={`board:${project.id}`}
    onSelect={onSelect}
    className={cn('h-11', className)}
  >
    <ProjectAvatar
      project={project}
      size="size-6.5"
      rounded="rounded-md"
      textSize="text-xs"
    />
    <span className="truncate font-medium">{project.name}</span>
    {isCurrent && (
      <Badge variant="outline" className="h-5 px-1.75 text-2xs">
        <span className="size-1.5 rounded-full bg-success" />
        Current
      </Badge>
    )}
    {project.archived && (
      <Badge variant="secondary" className="h-5 px-1.75 text-2xs">
        Archived
      </Badge>
    )}
    <span className="flex-1" />
    <span className="shrink-0 text-xs text-ink-subtle">
      {project.archived
        ? 'Read-only'
        : memberCountLabel(project.members?.length ?? 0)}
    </span>
    <Kbd className="hidden group-data-[selected=true]:inline-grid">↵</Kbd>
  </CommandItem>
);
