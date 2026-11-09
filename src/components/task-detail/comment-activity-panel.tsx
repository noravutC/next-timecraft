'use client';

import { useState } from 'react';
import { Activity } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useTaskStore } from '@/store/use-task.store';
import { CommentList } from './comment-list';

interface Props {
  taskId: string;
  currentUserId: string;
  canReact: boolean;
  canManageOwn: boolean;
}

type DiscussionTab = 'comments' | 'activity';

/** Comments / Activity tabs under the task body (the composer is pinned below). */
export const CommentActivityPanel = ({
  taskId,
  currentUserId,
  canReact,
  canManageOwn,
}: Props) => {
  const commentCount = useTaskStore((s) => s.tasks[taskId]?.commentCount ?? 0);
  const [tab, setTab] = useState<DiscussionTab>('comments');

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => setTab(v as DiscussionTab)}
      className="mt-7 gap-0"
    >
      <TabsList variant="underline" aria-label="Discussion">
        <TabsTrigger value="comments">
          Comments
          {commentCount > 0 && <Badge variant="count">{commentCount}</Badge>}
        </TabsTrigger>
        <TabsTrigger value="activity">
          Activity
          <Badge variant="outline" className="h-4.5 px-1.5 text-2xs">
            Soon
          </Badge>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="comments" className="pt-5">
        <CommentList
          taskId={taskId}
          currentUserId={currentUserId}
          canReact={canReact}
          canManageOwn={canManageOwn}
        />
      </TabsContent>

      <TabsContent
        value="activity"
        className="flex flex-col items-center gap-1.5 py-10 text-center"
      >
        <span className="mb-1 grid size-9 place-items-center rounded-lg border border-line text-ink-subtle">
          <Activity className="size-4" />
        </span>
        <span className="text-base font-medium text-ink">
          Activity history is coming soon
        </span>
        <span className="text-sm text-ink-subtle">
          Moves, edits and assignments will appear here.
        </span>
      </TabsContent>
    </Tabs>
  );
};
