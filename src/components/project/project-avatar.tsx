'use client';

import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TONE_STYLES } from '@/components/people/user-avatar';
import { boardTone } from '@/lib/project-settings/constants';
import { initialsOf } from '@/helper/utils/person-name';
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
  /** Letter size; pick to match the tile (text-3xs for 18px … text-xs for 28px). */
  textSize?: string;
  className?: string;
}

/** Board tile: the board's first letter on its accent tone. */
export const ProjectAvatar = ({
  project,
  size = 'size-8',
  rounded = 'rounded-lg',
  textSize = 'text-xs',
  className,
}: ProjectAvatarProps) => {
  const tone = boardTone(withSettingsDefaults(project.settings).color);

  return (
    <Avatar className={cn('shrink-0', size, rounded, className)}>
      {project.coverImage && (
        <AvatarImage src={project.coverImage} alt={project.name} />
      )}
      <AvatarFallback
        className={cn('font-semibold', rounded, textSize, TONE_STYLES[tone])}
      >
        {initialsOf(project.name, 1)}
      </AvatarFallback>
    </Avatar>
  );
};
