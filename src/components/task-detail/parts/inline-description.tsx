'use client';

import { useEffect, useRef, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface InlineDescriptionProps {
  value: string | null;
  onCommit: (next: string) => void;
}

export const InlineDescription = ({
  value,
  onCommit,
}: InlineDescriptionProps) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editing) setDraft(value ?? '');
  }, [value, editing]);

  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if ((draft || '') !== (value || '')) onCommit(draft);
  };

  if (editing) {
    return (
      <Textarea
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation();
            setEditing(false);
            setDraft(value ?? '');
          }
        }}
        placeholder="Add a description…"
        aria-label="Description"
        className="min-h-24 leading-5.5"
      />
    );
  }

  return (
    <div
      onClick={() => setEditing(true)}
      className={cn(
        '-mx-2 min-h-11 cursor-text rounded-md px-2 py-1.5 text-base leading-5.5 text-pretty hover:bg-surface-hover',
        value ? 'text-ink-muted' : 'text-ink-subtle',
      )}
    >
      {value ? (
        <p className="whitespace-pre-wrap">{value}</p>
      ) : (
        'Add a description…'
      )}
    </div>
  );
};
