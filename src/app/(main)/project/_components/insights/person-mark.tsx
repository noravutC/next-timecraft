import { UserAvatar } from '@/components/people/user-avatar';
import type { InsightsPerson } from '@/types';

/** A person's avatar, or a gray "?" for tasks nobody is assigned to. */
export const PersonMark = ({ person }: { person: InsightsPerson | null }) =>
  person ? (
    <UserAvatar
      name={person.fullName}
      image={person.avatar}
      seed={person.id}
      size="sm"
      className="shrink-0"
    />
  ) : (
    <span
      aria-hidden
      className="grid size-5.5 shrink-0 place-items-center rounded-full bg-surface-hover text-4xs font-semibold text-ink-muted"
    >
      ?
    </span>
  );
