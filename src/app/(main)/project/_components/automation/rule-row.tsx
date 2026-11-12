'use client';

import {
  CornerDownRight,
  MoreHorizontal,
  Pencil,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { ProjectSettings } from '@/types/project-settings';
import { TRIGGER_ICONS } from './automation-icons';
import type { RuleRowView } from './automation-operations';
import { RuleParts, type PeopleById } from './rule-parts';

const TONES: Record<RuleRowView['tone'] | 'off', string> = {
  change: 'bg-tone-violet text-tone-violet-fg',
  schedule: 'bg-tone-blue text-tone-blue-fg',
  fix: 'bg-warning-soft text-warning-text',
  off: 'bg-surface-hover text-ink-subtle',
};

/** One rule in the list: its sentence, how it is doing, and its switch. */
export const RuleRow = ({
  row,
  people,
  tagColors,
  canManage,
  onOpen,
  onToggle,
  onDelete,
}: {
  row: RuleRowView;
  people: PeopleById;
  tagColors: Required<ProjectSettings>['tagColors'];
  canManage: boolean;
  onOpen: (ruleId: string) => void;
  onToggle: (ruleId: string, enabled: boolean) => void;
  onDelete: (ruleId: string) => void;
}) => {
  const Icon = TRIGGER_ICONS[row.trigger];
  const off = !row.enabled;
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-0.5 border-t border-line-soft py-1 pr-2 pl-1 first:border-t-0">
      <Button
        variant="ghost"
        size={null}
        onClick={() => onOpen(row.id)}
        className="h-auto min-w-0 grow basis-80 justify-start gap-3 rounded-lg p-2 text-left font-normal whitespace-normal"
      >
        <span
          aria-hidden
          className={cn(
            'grid size-9 shrink-0 place-items-center rounded-lg',
            TONES[off ? 'off' : row.tone],
          )}
        >
          <Icon className="size-4.25" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span
            className={cn(
              'flex flex-wrap items-center gap-x-1.5 gap-y-1 text-base font-medium',
              off ? 'text-ink-subtle' : 'text-ink',
            )}
          >
            <RuleParts
              parts={row.when}
              people={people}
              tagColors={tagColors}
              muted={off}
            />
          </span>
          <span
            className={cn(
              'flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm',
              off ? 'text-ink-subtle' : 'text-ink-muted',
            )}
          >
            <CornerDownRight aria-hidden className="size-3.5 text-ink-faint" />
            <RuleParts
              parts={row.then}
              people={people}
              tagColors={tagColors}
              muted={off}
            />
          </span>
        </span>
      </Button>
      <span className="ml-auto flex shrink-0 items-center gap-3 pl-2">
        {row.fix ? (
          <span className="inline-flex h-5.5 items-center gap-1.25 rounded-full bg-warning-soft px-2 text-xs font-medium whitespace-nowrap text-warning-text">
            <TriangleAlert aria-hidden className="size-3" />
            Needs a fix
          </span>
        ) : (
          <span className="text-xs whitespace-nowrap text-ink-subtle">
            {row.meta}
          </span>
        )}
        <Switch
          checked={row.enabled}
          onCheckedChange={(next) => onToggle(row.id, next)}
          disabled={!canManage}
          aria-label={`${row.enabled ? 'Turn off' : 'Turn on'}: ${row.sentence}`}
        />
        {canManage && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`More actions: ${row.sentence}`}
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onSelect={() => onOpen(row.id)}>
                <Pencil />
                Edit rule
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => onDelete(row.id)}
              >
                <Trash2 />
                Delete rule
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </span>
    </li>
  );
};
