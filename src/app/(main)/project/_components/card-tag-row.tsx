import { Ban } from 'lucide-react';
import { UserAvatar } from '@/components/people/user-avatar';
import { AvatarGroup, AvatarGroupCount } from '@/components/ui/avatar';
import { hashTagColor, paletteFor } from '@/lib/project-settings/tag-palette';
import type { TaskAssigneeUser } from '@/services/assignee.service';

const MAX_VISIBLE_TAGS = 2;
const MAX_VISIBLE_ASSIGNEES = 3;

/** A card's middle row: Blocked first, then labels, avatars on the right. */
export const CardTagRow = ({
  tags,
  tagColors,
  assignees,
  blocked,
}: {
  tags: string[];
  tagColors: Record<string, string>;
  assignees: TaskAssigneeUser[];
  blocked: boolean;
}) => (
  <div className="flex items-center gap-2">
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
      {blocked && (
        <span className="inline-flex h-5.5 items-center gap-1.25 rounded-full border border-danger-line bg-danger-soft/40 px-2 text-xs text-danger-text">
          <Ban className="size-3" />
          Blocked
        </span>
      )}
      {tags.slice(0, MAX_VISIBLE_TAGS).map((tag) => (
        <span
          key={tag}
          className="inline-flex h-5.5 items-center gap-1.5 rounded-full border border-line px-2 text-xs text-ink-muted"
        >
          <span
            className="size-1.5 rounded-full"
            style={{
              backgroundColor: paletteFor(tagColors[tag] ?? hashTagColor(tag))
                .value,
            }}
          />
          {tag}
        </span>
      ))}
      {tags.length > MAX_VISIBLE_TAGS && (
        <span className="text-xs text-ink-subtle">
          +{tags.length - MAX_VISIBLE_TAGS}
        </span>
      )}
    </div>
    {assignees.length > 0 && (
      <AvatarGroup className="shrink-0">
        {assignees.slice(0, MAX_VISIBLE_ASSIGNEES).map((a) => (
          <UserAvatar
            key={a.userId}
            name={a.fullName}
            image={a.avatar}
            seed={a.userId}
            size="sm"
            className="ring-2 ring-background"
          />
        ))}
        {assignees.length > MAX_VISIBLE_ASSIGNEES && (
          <AvatarGroupCount className="size-5.5 text-4xs">
            +{assignees.length - MAX_VISIBLE_ASSIGNEES}
          </AvatarGroupCount>
        )}
      </AvatarGroup>
    )}
  </div>
);
