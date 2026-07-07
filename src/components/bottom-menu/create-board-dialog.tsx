'use client';

import { useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useProjectStore } from '@/store';
import { useColumnStore } from '@/store/use-column.store';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  BOARD_TEMPLATES,
  type BoardTemplate,
} from '@/helper/default-project';

interface CreateBoardDialogProps {
  open: boolean;
  onClose: () => void;
}

// ขนาด h-[560px]/max-w-2xl ต้องตรงกับ ProjectSwitcherPanel เสมอ —
// dialog นี้เปิดต่อจากหน้านั้น ถ้าสูงไม่เท่ากันจอจะกระตุก
export const CreateBoardDialog = ({ open, onClose }: CreateBoardDialogProps) => {
  const createProject = useProjectStore((s) => s.createProject);
  const createColumns = useColumnStore((s) => s.createColumns);

  const [name, setName] = useState('');
  const [templateId, setTemplateId] = useState(BOARD_TEMPLATES[0].id);
  const [creating, setCreating] = useState(false);

  // เปิดใหม่ทุกครั้ง reset เป็นค่า default (ชื่อว่าง + Kanban Board) —
  // adjust-state-on-prop-change ไม่ใช้ effect เพื่อเลี่ยง cascading render
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setName('');
      setTemplateId(BOARD_TEMPLATES[0].id);
      setCreating(false);
    }
  }

  const template =
    BOARD_TEMPLATES.find((t) => t.id === templateId) ?? BOARD_TEMPLATES[0];
  const canCreate = name.trim().length > 0 && !creating;

  const handleCreate = async () => {
    if (!canCreate) return;
    setCreating(true);
    try {
      const created = await createProject({ name: name.trim() });
      if (!created) {
        toast.error('Unable to create board.');
        return;
      }
      await createColumns(
        template.columns.map((col) => ({
          name: col.name,
          color: col.color,
          projectId: created.id,
          orderFraction: '',
        })),
      );
      toast.success('Board created.');
      onClose();
    } catch {
      toast.error('Unable to create board.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[560px] flex-col gap-0 rounded-2xl p-0 sm:max-w-2xl"
      >
        <DialogHeader className="flex-row items-center gap-3 space-y-0 border-b px-6 py-4 text-left">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand">
            <Plus className="size-5 text-white" />
          </div>
          <div className="min-w-0">
            <DialogTitle className="text-lg font-semibold text-ink">
              Create new board
            </DialogTitle>
            <DialogDescription className="text-sm text-ink-subtle">
              Start from a system template or a blank board
            </DialogDescription>
          </div>
          <DialogClose className="ml-auto flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-surface text-ink-muted transition-colors hover:bg-surface-active hover:text-ink">
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>

        <div className="scrollbar-thin-y scrollbar-light min-h-0 flex-1 overflow-y-auto px-6 py-5 [overflow-anchor:none]">
          <p className="text-xs font-semibold tracking-wider text-ink-subtle uppercase">
            Board name
          </p>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-xl">
              📁
            </div>
            <Input
              inputSize="lg"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleCreate();
              }}
              placeholder="e.g. Q4 Launch Plan"
              className="rounded-lg border-line bg-surface text-sm shadow-none placeholder:text-ink-faint focus-visible:bg-white"
            />
          </div>

          <p className="mt-6 mb-3 text-xs font-semibold tracking-wider text-ink-subtle uppercase">
            Choose a template
          </p>
          <div className="grid grid-cols-2 gap-3">
            {BOARD_TEMPLATES.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                isSelected={t.id === templateId}
                onSelect={() => setTemplateId(t.id)}
              />
            ))}
          </div>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t px-6 py-4">
          <p className="truncate text-sm text-ink-subtle">
            {template.columns.length} columns · {template.name}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="h-9 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              disabled={!canCreate}
              onClick={() => void handleCreate()}
              className="h-9 gap-1.5 rounded-lg bg-brand hover:bg-brand-dark"
            >
              <Plus className="size-4" />
              {creating ? 'Creating…' : 'Create board'}
            </Button>
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
};

const TemplateCard = ({
  template,
  isSelected,
  onSelect,
}: {
  template: BoardTemplate;
  isSelected: boolean;
  onSelect: () => void;
}) => (
  <button
    type="button"
    onClick={onSelect}
    className={cn(
      'relative flex cursor-pointer flex-col gap-2.5 rounded-xl border p-4 text-left transition-colors',
      isSelected
        ? 'border-brand-line bg-brand-soft/40'
        : 'border-line bg-white hover:border-brand-line',
    )}
  >
    <div className="flex items-center gap-3 pr-6">
      <div
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-xl text-lg',
          template.emojiBg,
        )}
      >
        {template.emoji}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-ink">
          {template.name}
        </p>
        <p className="truncate text-xs text-ink-subtle">{template.tagline}</p>
      </div>
    </div>
    {isSelected && (
      <span className="absolute top-4 right-4 flex size-5 items-center justify-center rounded-full bg-brand">
        <Check className="size-3 text-white" />
      </span>
    )}
    <div className="flex flex-wrap gap-1.5">
      {template.columns.map((col) => (
        <span
          key={col.name}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium text-ink-muted',
            isSelected ? 'bg-white' : 'bg-surface',
          )}
        >
          <span
            className="size-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: col.color }}
          />
          {col.name}
        </span>
      ))}
    </div>
  </button>
);
