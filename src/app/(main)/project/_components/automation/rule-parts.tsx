import { UserAvatar } from '@/components/people/user-avatar';
import { ColumnMark } from '@/components/task-meta/column-mark';
import { PriorityBars } from '@/components/task-meta/priority-bars';
import type { RulePart } from '@/helper/utils/automation-text';
import { hashTagColor, paletteFor } from '@/lib/project-settings/tag-palette';
import { cn } from '@/lib/utils';
import type { ProjectSettings } from '@/types/project-settings';

/** People by id, to draw a person's chip with their photo. */
export type PeopleById = Record<
  string,
  { name: string; avatar: string | null }
>;

const CHIP =
  'inline-flex h-5.5 items-center gap-1.25 rounded-full border border-line bg-background px-2 text-xs font-medium whitespace-nowrap';

/** A rule in words: plain text, with its values drawn as chips. */
export const RuleParts = ({
  parts,
  people,
  tagColors,
  muted = false,
}: {
  parts: RulePart[];
  people: PeopleById;
  tagColors: Required<ProjectSettings>['tagColors'];
  /** a rule that is off: everything in the quiet text color */
  muted?: boolean;
}) => {
  const chip = cn(CHIP, muted ? 'text-ink-subtle' : 'text-ink');
  return parts.map((part, i) => {
    const key = `${i}-${part.text}`;
    switch (part.kind) {
      case 'text':
        return <span key={key}>{part.text}</span>;
      case 'column':
        return (
          <span key={key} className={chip}>
            <ColumnMark color={part.color} className="size-1.5" />
            {part.text}
          </span>
        );
      case 'person':
        return (
          <span key={key} className={cn(chip, 'pl-0.75')}>
            <UserAvatar
              name={people[part.userId]?.name ?? part.text}
              image={people[part.userId]?.avatar}
              seed={part.userId}
              size="xs"
              className="size-4"
            />
            {part.text}
          </span>
        );
      case 'label':
        return (
          <span key={key} className={chip}>
            <span
              aria-hidden
              className="size-1.5 shrink-0 rounded-full"
              style={{
                backgroundColor: paletteFor(
                  tagColors[part.text] ?? hashTagColor(part.text),
                ).value,
              }}
            />
            {part.text}
          </span>
        );
      case 'priority':
        return (
          <span key={key} className={chip}>
            <PriorityBars priority={part.level} decorative />
            {part.text}
          </span>
        );
      case 'value':
        return (
          <span key={key} className={chip}>
            {part.text}
          </span>
        );
    }
  });
};
