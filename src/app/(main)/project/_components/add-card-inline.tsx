'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useTaskStore } from '@/store/use-task.store';
import { generateFractionBetween } from '@/helper/utils/fraction-string-indexing';
import { blockBoardPanningAttr } from './data-attributes';
import { cn } from '@/lib/utils';

interface AddCardInlineProps {
  columnId: string;
  /** ตำแหน่งของ composer = ตำแหน่งที่การ์ดใหม่จะแทรก */
  position: 'top' | 'bottom';
  prevOrderFraction: string | null;
  nextOrderFraction: string | null;
  onClose: () => void;
}

export const AddCardInline = ({
  columnId,
  position,
  prevOrderFraction,
  nextOrderFraction,
  onClose,
}: AddCardInlineProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const createTasks = useTaskStore((s) => s.createTasks);
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = async () => {
    const trimmed = title.trim();
    if (!trimmed || isSubmitting) return;
    setIsSubmitting(true);
    try {
      // ขอบเขตสองข้างมาจาก parent (การ์ดเพื่อนบ้าน/cursor ของ column) — สดเสมอ
      // เพราะ column re-render ทุกครั้งที่ store เปลี่ยน
      const orderFraction = generateFractionBetween(
        prevOrderFraction,
        nextOrderFraction,
      );
      await createTasks([{ columnId, title: trimmed, orderFraction }]);
      setTitle('');
      textareaRef.current?.focus();
    } catch {
      toast.error('Failed to add card');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className={cn(
        'mx-2 flex flex-shrink-0 flex-col gap-2.5 rounded-lg border border-ink bg-white p-2.5 shadow-[0_0_0_3px_rgba(23,23,23,0.06)]',
        position === 'top' ? 'mb-2' : 'mt-2',
      )}
      {...{ [blockBoardPanningAttr]: true }}
    >
      <Textarea
        ref={textareaRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="What needs to be done?"
        aria-label="Task title"
        className="min-h-10 resize-none rounded-none border-0 bg-transparent p-0 text-sm leading-snug text-ink focus-visible:ring-0"
      />
      <div className="flex flex-row items-center gap-1.5">
        <span className="font-mono text-xs whitespace-nowrap text-ink-subtle">
          ↵ to add
        </span>
        <div className="flex-1" />
        <Button size="xs" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          size="xs"
          disabled={!title.trim() || isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? 'Adding…' : 'Add card'}
        </Button>
      </div>
    </div>
  );
};
