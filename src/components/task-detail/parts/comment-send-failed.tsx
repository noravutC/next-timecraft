'use client';

import { CircleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Under a comment that didn't send: says so, and sends it again. */
export const CommentSendFailed = ({ onRetry }: { onRetry: () => void }) => (
  <div
    role="alert"
    className="flex items-center gap-2 text-xs text-danger-text"
  >
    <CircleAlert className="size-3.5 shrink-0" />
    Couldn’t send. Your text is kept here.
    <Button variant="outline" size="xs" onClick={onRetry} className="h-6">
      Retry
    </Button>
  </div>
);
