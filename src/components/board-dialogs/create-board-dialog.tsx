'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { BOARD_TEMPLATES } from '@/helper/default-project';
import {
  findBoardTemplate,
  templateFlow,
} from '@/helper/utils/board-templates';
import { TemplatePicker } from '@/components/board-templates/template-picker';
import { useCreateBoard } from '@/components/board-templates/use-create-board';

interface CreateBoardDialogProps {
  open: boolean;
  onClose: () => void;
}

export const CreateBoardDialog = ({
  open,
  onClose,
}: CreateBoardDialogProps) => {
  const { creating, createBoard } = useCreateBoard();
  const [name, setName] = useState('');
  const [templateId, setTemplateId] = useState(BOARD_TEMPLATES[0].id);

  // เปิดใหม่ทุกครั้ง reset เป็นค่า default (ชื่อว่าง + Kanban Board) —
  // adjust-state-on-prop-change ไม่ใช้ effect เพื่อเลี่ยง cascading render
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setName('');
      setTemplateId(BOARD_TEMPLATES[0].id);
    }
  }

  const canCreate = name.trim().length > 0 && !creating;

  const handleCreate = async () => {
    if (!canCreate) return;
    if (await createBoard({ name, templateId })) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[calc(100vh-2rem)] sm:max-w-160">
        <DialogHeader>
          <DialogTitle>Create board</DialogTitle>
          <DialogDescription className="leading-5">
            Name it and pick a template to set up the columns.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="min-h-0 overflow-y-auto">
          <div className="flex flex-col gap-2">
            <Label htmlFor="create-board-name" className="leading-5">
              Board name
            </Label>
            <Input
              id="create-board-name"
              inputSize="lg"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleCreate();
              }}
              placeholder="e.g. Q4 Launch Plan"
            />
          </div>
          <TemplatePicker value={templateId} onChange={setTemplateId} />
        </DialogBody>

        <DialogFooter>
          <span className="min-w-0 flex-1 truncate font-mono text-xs text-ink-subtle">
            {templateFlow(findBoardTemplate(templateId))}
          </span>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!canCreate} onClick={() => void handleCreate()}>
            {creating ? 'Creating…' : 'Create board'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
