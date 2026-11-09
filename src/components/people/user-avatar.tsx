import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toneFor, type Tone } from '@/helper/utils/avatar-tone';
import { initialsOf } from '@/helper/utils/person-name';
import { cn } from '@/lib/utils';

export const TONE_STYLES: Record<Tone, string> = {
  violet: 'bg-tone-violet text-tone-violet-fg',
  blue: 'bg-tone-blue text-tone-blue-fg',
  green: 'bg-tone-green text-tone-green-fg',
  orange: 'bg-tone-orange text-tone-orange-fg',
  red: 'bg-tone-red text-tone-red-fg',
  pink: 'bg-tone-pink text-tone-pink-fg',
  cyan: 'bg-tone-cyan text-tone-cyan-fg',
  slate: 'bg-tone-slate text-tone-slate-fg',
};

export type UserAvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// px: xs 20 · sm 22 (cards) · md 26 (header stack) · lg 28 (account, comments) · xl 32
const SIZE_STYLES: Record<UserAvatarSize, string> = {
  xs: 'size-5 text-4xs',
  sm: 'size-5.5 text-4xs',
  md: 'size-6.5 text-3xs',
  lg: 'size-7 text-3xs',
  xl: 'size-8 text-2xs',
};

interface UserAvatarProps {
  name: string | null | undefined;
  image?: string | null;
  /** Stable id for the tone; falls back to the name. */
  seed?: string | null;
  size?: UserAvatarSize;
  className?: string;
}

/** A person: their photo, or initials on a stable pastel tone. */
export const UserAvatar = ({
  name,
  image,
  seed,
  size = 'lg',
  className,
}: UserAvatarProps) => (
  <Avatar className={cn(SIZE_STYLES[size], className)}>
    {image && <AvatarImage src={image} alt={name ?? ''} />}
    <AvatarFallback
      className={cn('font-semibold', TONE_STYLES[toneFor(seed || name || '')])}
    >
      {initialsOf(name)}
    </AvatarFallback>
  </Avatar>
);
