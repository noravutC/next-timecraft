'use client';

import { useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { recentDays } from '@/helper/utils/calendar-grid';
import { parseDuration } from '@/helper/utils/duration';
import { taskServices } from '@/services/tasks.service';
import { useTaskStore } from '@/store/use-task.store';

const fieldLabel = 'text-xs font-medium text-ink-muted';

/** "Log time": how long, which day, an optional note for the Activity. */
export const LogTimePopover = ({ taskId }: { taskId: string }) => {
  const [open, setOpen] = useState(false);
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const days = recentDays(7);
  const [day, setDay] = useState(days[0].key);

  const reset = () => {
    setTime('');
    setNote('');
    setError(null);
    setDay(days[0].key);
  };

  const submit = async () => {
    const minutes = parseDuration(time);
    if (!minutes) {
      setError('Try 45m, 2h or 1h 30m, up to a day');
      return;
    }
    setBusy(true);
    try {
      const updated = await taskServices.logTime(taskId, {
        minutes,
        day,
        note: note.trim() || undefined,
      });
      useTaskStore.getState().upsertOpenedTask(updated);
      setOpen(false);
      reset();
    } catch {
      toast.error('Couldn’t log the time');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="xs"
          className="h-7 gap-1 px-2 text-ink-muted data-[state=open]:bg-surface-active"
        >
          <Plus className="size-3.5" />
          Log time
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-75 p-3.5">
        <form
          aria-label="Log time"
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1.5">
              <span className={fieldLabel}>Time</span>
              <Input
                autoFocus
                value={time}
                onChange={(e) => {
                  setTime(e.target.value);
                  setError(null);
                }}
                placeholder="45m"
                aria-invalid={Boolean(error)}
                className="h-8.5 font-mono"
              />
            </label>
            <span className="flex flex-col gap-1.5">
              <span className={fieldLabel}>Day</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8.5 justify-between border-input px-2.5 font-normal"
                  >
                    {days.find((d) => d.key === day)?.label}
                    <ChevronDown className="size-3.5 text-ink-subtle" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-40">
                  <DropdownMenuRadioGroup value={day} onValueChange={setDay}>
                    {days.map((d) => (
                      <DropdownMenuRadioItem key={d.key} value={d.key}>
                        {d.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </span>
          </div>
          {error && <p className="-mt-1 text-xs text-danger-text">{error}</p>}
          <label className="flex flex-col gap-1.5">
            <span className={fieldLabel}>
              Note{' '}
              <span className="font-normal text-ink-subtle">(optional)</span>
            </span>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
              className="h-8.5"
            />
            <span className="text-xs text-ink-subtle">
              Shows up in Activity
            </span>
          </label>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={busy}>
              Log time
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
};
