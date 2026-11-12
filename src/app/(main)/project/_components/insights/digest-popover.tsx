'use client';

import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { digestStatusLine } from './insights-operations';
import { useDigest } from './use-digest';

/** Your weekly digest email for this board: on or off, and a sample. */
export const DigestPopover = ({ projectId }: { projectId: string }) => {
  const { state, setOn, isGuest } = useDigest(projectId);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-line data-[state=open]:border-ink"
        >
          <Mail className="size-3.75 text-ink-muted" />
          Weekly digest
          {state && (
            <span className="font-normal text-ink-subtle">
              {state.on ? 'On' : 'Off'}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="flex w-80 flex-col gap-3 p-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-ink">Weekly digest</h2>
          <p className="text-sm leading-4.75 text-ink-muted">
            An email every Monday at 9:00 with what was finished on this board
            last week, and what is overdue or stuck.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-line px-3 py-2.5">
          <span
            id="digest-label"
            className="flex-1 text-sm font-medium text-ink"
          >
            Email it to me
          </span>
          <Switch
            aria-labelledby="digest-label"
            checked={Boolean(state?.on)}
            disabled={!state || isGuest}
            onCheckedChange={setOn}
          />
        </div>
        <div className="flex items-center gap-2 text-xs leading-4.5 text-ink-subtle">
          <span className="flex-1">{digestStatusLine(state, isGuest)}</span>
          <a
            href={`/api/project/${projectId}/digest/preview`}
            target="_blank"
            rel="noreferrer"
            className="font-medium whitespace-nowrap text-ink underline underline-offset-2"
          >
            See an example
          </a>
        </div>
        <p className="border-t border-line-soft pt-2.5 text-xs leading-4.5 text-ink-subtle">
          Only your own email changes. Other members choose for themselves.
        </p>
      </PopoverContent>
    </Popover>
  );
};
