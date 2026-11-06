'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { COLUMN_COLORS } from '@/lib/project-settings/constants';
import { useProjectStore } from '@/store';
import { useColumnStore } from '@/store/use-column.store';
import { ColumnColorSwatches } from './column-color-swatches';

/** The last lane: "Add column", which opens a name and color form. */
export const AddColumnLane = () => {
  const projectId = useProjectStore((s) => s.projectIsUsing);
  const createColumns = useColumnStore((s) => s.createColumns);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLUMN_COLORS[7].value);
  const [saving, setSaving] = useState(false);

  const close = () => {
    setOpen(false);
    setName('');
  };

  const add = async () => {
    const trimmed = name.trim();
    if (!projectId || !trimmed || saving) return;
    setSaving(true);
    try {
      await createColumns([{ projectId, name: trimmed, color }]);
      close();
    } catch {
      toast.error('Couldn’t add the column');
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <Button
        variant="ghost"
        onClick={() => setOpen(true)}
        className="h-11 w-67 shrink-0 justify-start gap-2 rounded-xl border border-dashed border-line-strong px-3.5 font-normal text-ink-muted hover:border-ink-faint hover:bg-surface"
      >
        <Plus className="size-3.75" />
        Add column
      </Button>
    );
  }

  return (
    <form
      aria-label="New column"
      onSubmit={(e) => {
        e.preventDefault();
        void add();
      }}
      onKeyDown={(e) => e.key === 'Escape' && close()}
      className="flex w-67 shrink-0 flex-col gap-3 rounded-xl border border-line bg-background p-3 shadow-card"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new-column-name" className="text-xs text-ink-subtle">
          Column name
        </Label>
        <Input
          id="new-column-name"
          autoFocus
          value={name}
          maxLength={100}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. QA"
        />
      </div>
      <ColumnColorSwatches
        label="New column color"
        value={color}
        onChange={setColor}
      />
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-2xs text-ink-subtle">
          ↵ add · esc cancel
        </span>
        <span className="flex-1" />
        <Button type="button" variant="ghost" size="xs" onClick={close}>
          Cancel
        </Button>
        <Button type="submit" size="xs" disabled={!name.trim() || saving}>
          Add column
        </Button>
      </div>
    </form>
  );
};
