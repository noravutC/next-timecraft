'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type SearchScope = 'all' | 'here';

/** All boards / This board, under the ⌘K input while searching. */
export const SearchScopeBar = ({
  scope,
  onScope,
  canSearchHere,
}: {
  scope: SearchScope;
  onScope: (scope: SearchScope) => void;
  /** a board is open to narrow to */
  canSearchHere: boolean;
}) => (
  <div className="flex items-center gap-1.5 border-b border-line px-4 py-2.5">
    {(
      [
        ['all', 'All boards'],
        ['here', 'This board'],
      ] as const
    )
      .filter(([value]) => value === 'all' || canSearchHere)
      .map(([value, label]) => (
        <Button
          key={value}
          type="button"
          variant="outline"
          size="xs"
          aria-pressed={scope === value}
          onClick={() => onScope(value)}
          className={cn(
            'h-7 rounded-full px-2.5 font-normal',
            scope === value &&
              'border-ink bg-ink text-white hover:bg-ink hover:text-white',
          )}
        >
          {label}
        </Button>
      ))}
    <span className="flex-1" />
    <span className="hidden text-xs text-ink-subtle sm:inline">
      Titles, descriptions and comments
    </span>
  </div>
);
