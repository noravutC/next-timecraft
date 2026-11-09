'use client';

import { useState } from 'react';
import { Lock, Rss } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { projectServices } from '@/services/projects.service';

/** Your iCal link for this board, to add to a calendar app. */
export const SubscribePopover = ({
  projectId,
  boardName,
}: {
  projectId: string;
  boardName: string;
}) => {
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = (reset: boolean) => {
    setBusy(true);
    setCopied(false);
    projectServices
      .getCalendarFeed(projectId, reset)
      .then((next) => {
        setUrl(next);
        if (reset) toast.success('New link made. The old one stopped working.');
      })
      .catch(() => toast.error('Couldn’t get the calendar link'))
      .finally(() => setBusy(false));
  };

  const copy = async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
  };

  return (
    <Popover
      onOpenChange={(open) => {
        setCopied(false);
        if (open && !url) load(false);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-line data-[state=open]:border-ink"
        >
          <Rss className="size-3.5" />
          Subscribe
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="flex w-95 flex-col gap-3 p-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-ink">
            Subscribe to this calendar
          </h2>
          <p className="text-sm leading-4.75 text-ink-muted">
            Due dates from {boardName} show up in Google Calendar, Apple
            Calendar or Outlook, and update when they change here.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            readOnly
            value={url ?? 'Making your link…'}
            aria-label="Calendar feed link"
            onFocus={(e) => e.currentTarget.select()}
            className="h-8.5 min-w-0 flex-1 border-line bg-surface font-mono text-xs"
          />
          <Button size="sm" className="h-8.5" disabled={!url} onClick={copy}>
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
        <div className="flex items-start gap-2 border-t border-line-soft pt-3">
          <Lock className="mt-0.5 size-3.5 shrink-0 text-ink-subtle" />
          <span className="flex-1 text-xs leading-4.5 text-ink-muted">
            Anyone with this link can see task titles and due dates. Reset it to
            cut off old copies.
          </span>
          <Button
            variant="ghost"
            size="xs"
            disabled={busy || !url}
            onClick={() => load(true)}
            className="h-6.5"
          >
            Reset link
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
