'use client';

import { ProjectAvatar } from '@/components/project/project-avatar';
import { CommandGroup, CommandItem } from '@/components/ui/command';
import { Loader } from '@/components/ui/loader';
import { splitMatch } from '@/helper/utils/search';
import type { TaskSearchHit } from '@/types';

const MATCH_LABEL = { description: 'Description', comment: 'Comment' } as const;

/** The words that matched, marked. */
const Highlight = ({ text, query }: { text: string; query: string }) => {
  const parts = splitMatch(text, query);
  if (!parts) return <>{text}</>;
  return (
    <>
      {parts[0]}
      <mark className="rounded-xs bg-warning-tint text-ink">{parts[1]}</mark>
      {parts[2]}
    </>
  );
};

interface SwitcherTaskResultsProps {
  hits: TaskSearchHit[];
  query: string;
  searching: boolean;
  onSelect: (hit: TaskSearchHit) => void;
}

/** ⌘K: tasks whose title, description or comments hold the words. */
export const SwitcherTaskResults = ({
  hits,
  query,
  searching,
  onSelect,
}: SwitcherTaskResultsProps) => (
  <CommandGroup
    heading={
      <span className="flex items-center gap-2">
        Tasks
        <span className="font-mono text-2xs">{hits.length}</span>
        {searching && <Loader size="xs" />}
      </span>
    }
  >
    {!searching && hits.length === 0 && (
      <p className="px-3 py-3 text-sm text-ink-subtle">
        No tasks match “{query.trim()}”
      </p>
    )}
    {hits.map((hit) => (
      <CommandItem
        key={hit.taskId}
        value={`task-${hit.taskId}`}
        onSelect={() => onSelect(hit)}
        className="h-auto items-start gap-3 py-2"
      >
        <ProjectAvatar
          project={{
            name: hit.projectName,
            coverImage: hit.coverImage,
            settings: hit.settings,
          }}
          size="size-6.5"
          rounded="rounded-md"
          textSize="text-xs"
        />
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="truncate text-base font-medium text-ink">
            <Highlight text={hit.title} query={query} />
          </span>
          {hit.snippet && hit.match !== 'title' && (
            <span className="flex min-w-0 items-center gap-1.5 text-xs text-ink-muted">
              <span className="shrink-0 rounded-sm border border-line bg-surface px-1.5 py-px text-2xs text-ink-subtle">
                {MATCH_LABEL[hit.match]}
              </span>
              <span className="truncate">
                <Highlight text={hit.snippet} query={query} />
              </span>
            </span>
          )}
          <span className="flex items-center gap-1.5 text-xs text-ink-subtle">
            {hit.projectName}
            <span aria-hidden>·</span>
            <span
              className="size-1.5 rounded-full"
              style={{ backgroundColor: hit.columnColor }}
            />
            {hit.columnName}
          </span>
        </span>
      </CommandItem>
    ))}
  </CommandGroup>
);
