import { LogoMark } from '@/components/logo-space/logo-mark';
import { TONE_STYLES } from '@/components/people/user-avatar';
import { cn } from '@/lib/utils';
import {
  PREVIEW_COLUMNS,
  PREVIEW_TEAM,
  type PreviewColumn,
  type PreviewPerson,
} from './landing-content';

const MiniAvatar = ({
  person,
  size,
}: {
  person: PreviewPerson;
  size: 'header' | 'card';
}) => (
  <span
    className={cn(
      'grid place-items-center rounded-full text-4xs font-semibold',
      size === 'header' ? 'size-5.5 ring-2 ring-background' : 'size-4.5',
      TONE_STYLES[person.tone],
    )}
  >
    {person.initials}
  </span>
);

const Column = ({ column }: { column: PreviewColumn }) => (
  <div className="flex flex-col gap-2 rounded-popover border border-line-soft bg-surface p-2">
    <div className="flex items-center gap-2 px-1.5 py-1 leading-6">
      <span
        className="size-1.75 rounded-full"
        style={{ backgroundColor: column.color }}
      />
      <span className="text-xs leading-6 font-semibold">{column.name}</span>
      <span className="font-mono text-2xs leading-6 text-ink-subtle">
        {column.cards.length}
      </span>
    </div>
    {column.cards.map((card) => (
      <div
        key={card.title}
        className="flex flex-col gap-2 rounded-lg border border-line bg-background p-2.5 shadow-card"
      >
        <span className="text-sm font-medium">{card.title}</span>
        <span className="flex items-center gap-1.5">
          <span className="inline-flex h-5.5 items-center gap-1.25 rounded-full border border-line px-1.75 text-2xs leading-3.5 text-ink-muted">
            <span
              className="size-1.25 rounded-full"
              style={{ backgroundColor: card.tagColor }}
            />
            {card.tag}
          </span>
          <span className="flex-1" />
          <MiniAvatar person={card.who} size="card" />
        </span>
      </div>
    ))}
  </div>
);

/** Decorative board mock under the hero. Not the real app. */
export function ProductPreview() {
  return (
    <section
      aria-label="Product preview"
      className="mx-auto max-w-312 px-6 pb-24"
    >
      {/* one-off deep drop shadow for the hero frame, no token */}
      <div
        aria-hidden
        className="rounded-xl border border-line bg-surface p-2.5 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.18)]"
      >
        <div className="overflow-hidden rounded-lg border border-line bg-background">
          <div className="flex h-11.25 items-center gap-2 border-b border-line px-4">
            <LogoMark size={18} />
            <span className="text-sm text-line-strong">/</span>
            <span className="text-sm font-semibold">Website Relaunch</span>
            <span className="flex-1" />
            <span className="flex -space-x-1.5">
              {PREVIEW_TEAM.map((person) => (
                <MiniAvatar
                  key={person.initials}
                  person={person}
                  size="header"
                />
              ))}
            </span>
          </div>
          <div className="grid gap-2.5 p-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {PREVIEW_COLUMNS.map((column) => (
              <Column key={column.name} column={column} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
