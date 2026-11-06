'use client';

import { Lock } from 'lucide-react';
import { CommandItem } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Kbd } from '@/components/ui/kbd';
import { ProjectAvatar } from '@/components/project/project-avatar';
import { memberCountLabel } from '@/helper/utils/board-switcher';
import { withSettingsDefaults } from '@/types/project-settings';
import type { ProjectCache } from '@/types';

/** One board row in the ⌘K palette: tile, name, state chips, member count. */
export const SwitcherBoardItem = ({
  project,
  isCurrent,
  onSelect,
}: {
  project: ProjectCache;
  isCurrent: boolean;
  onSelect: () => void;
}) => (
  <CommandItem
    value={`board:${project.id}`}
    onSelect={onSelect}
    className="h-11"
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
    {withSettingsDefaults(project.settings).isPrivate && (
      <Lock
        role="img"
        aria-label="Private board"
        className="size-3.25 text-ink-subtle"
      />
    )}
    {project.archived && (
      <Badge variant="secondary" className="h-5 px-1.75 text-2xs">
        Archived
      </Badge>
    )}
    <span className="flex-1" />
    <span className="shrink-0 text-xs text-ink-subtle">
      {memberCountLabel(project.members?.length ?? 0)}
    </span>
    <Kbd className="hidden group-data-[selected=true]:inline-grid">↵</Kbd>
  </CommandItem>
);
