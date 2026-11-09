'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useTaskStore } from '@/store/use-task.store';
import { CommentList } from './comment-list';
import { TaskActivityList } from './task-activity-list';

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
        <TabsTrigger value="activity">Activity</TabsTrigger>
      </TabsList>

      <TabsContent value="comments" className="pt-5">
        <CommentList
          taskId={taskId}
          currentUserId={currentUserId}
          canReact={canReact}
          canManageOwn={canManageOwn}
        />
      </TabsContent>

      <TabsContent value="activity" className="pt-5">
        <TaskActivityList taskId={taskId} />
      </TabsContent>
    </Tabs>
  );
};
