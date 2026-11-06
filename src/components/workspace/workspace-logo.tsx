'use client';

import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TONE_STYLES } from '@/components/people/user-avatar';
import { initialsOf } from '@/helper/utils/person-name';

interface WorkspaceLogoProps {
  workspace: { name: string; logo: string | null };
  size?: string;
  rounded?: string;
  /** Letter size; pick to match the tile (text-2xs for 20px … text-2xl for 64px). */
  textSize?: string;
  className?: string;
}

/** The workspace's logo, or its first letter when it has none. */
export const WorkspaceLogo = ({
  workspace,
  size = 'size-5',
  rounded = 'rounded-sm',
  textSize = 'text-2xs',
  className,
}: WorkspaceLogoProps) => (
  <Avatar className={cn('shrink-0', size, rounded, className)}>
    {workspace.logo && <AvatarImage src={workspace.logo} alt="" />}
    <AvatarFallback
      className={cn('font-semibold', rounded, textSize, TONE_STYLES.slate)}
    >
      {initialsOf(workspace.name, 1)}
    </AvatarFallback>
  </Avatar>
);
