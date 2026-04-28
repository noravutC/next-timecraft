'use client';

import { Folder } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ICON_OPTIONS } from '@/lib/project-settings/constants';
import {
  withSettingsDefaults,
  type ProjectSettings,
} from '@/types/project-settings';

interface ProjectAvatarProps {
  project: {
    name: string;
    coverImage: string | null;
    settings: ProjectSettings | null;
  };
  size?: string;
  rounded?: string;
  className?: string;
}

export const ProjectAvatar = ({
  project,
  size = 'size-8',
  rounded = 'rounded-lg',
  className,
}: ProjectAvatarProps) => {
  const settings = withSettingsDefaults(project.settings);
  const iconOption = ICON_OPTIONS.find((i) => i.id === settings.icon);
  const tint = settings.color;

  return (
    <Avatar
      className={cn('shrink-0', size, rounded, className)}
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
