'use client';

import { useEffect, useRef, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface InlineTitleProps {
  value: string;
  onCommit: (next: string) => void;
  className?: string;
  readOnly?: boolean;
}

// 24/32 semibold; the hover fill bleeds 8px left so text stays on the grid
const titleClass =
  '-ml-2 rounded-md px-2 py-1 text-2xl font-semibold tracking-tight';

export const InlineTitle = ({
  value,
  onCommit,
  className,
  readOnly = false,
}: InlineTitleProps) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && ref.current) {
      const el = ref.current;
      el.focus();
      const end = el.value.length;
      el.setSelectionRange(end, end);
    }
  }, [editing]);

  const commit = () => {
    const next = draft.trim();
    setEditing(false);
    if (next && next !== value) onCommit(next);
    else setDraft(value);
  };

  if (editing) {
    return (
      <Textarea
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            commit();
          } else if (e.key === 'Escape') {
            e.stopPropagation();
            setEditing(false);
            setDraft(value);
          }
        }}
        rows={1}
        aria-label="Task title"
        className={cn(
          titleClass,
          'min-h-0 w-[calc(100%+0.5rem)] resize-none border-0 bg-surface-hover text-ink shadow-none focus-visible:ring-0',
          className,
        )}
      />
    );
  }

  if (readOnly) {
    return (
      <div className={cn(titleClass, 'text-ink', className)}>
        {value || 'Untitled task'}
      </div>
    );
  }

  // the sheet's (screen-reader) title is the heading; this is its editable face
  return (
    <div
      onClick={() => {
        // start from the latest saved title (it may have changed remotely)
        setDraft(value);
        setEditing(true);
      }}
      className={cn(
        titleClass,
        'cursor-text text-ink hover:bg-surface-hover',
        !value && 'text-ink-subtle',
        className,
      )}
    >
      {value || 'Untitled task'}
    </div>
  );
};
