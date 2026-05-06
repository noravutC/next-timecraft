"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTaskStore } from "@/store/use-task.store";
import { CommentList } from "./comment-list";
import { CommentComposer } from "./comment-composer";
import { cn } from "@/lib/utils";

interface Props {
  taskId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
}

const TabButton = ({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "relative flex items-center gap-2 px-1 pb-2 text-sm transition-colors",
      active
        ? "font-semibold text-foreground"
        : "text-muted-foreground hover:text-foreground",
    )}
  >
    {children}
    {typeof count === "number" && count > 0 && (
      <span className="text-xs font-semibold text-primary bg-primary/10 size-5 flex items-center justify-center rounded-full">{count}</span>
    )}
    {active && (
      <span className="absolute right-0 bottom-0 left-0 h-0.5 bg-foreground" />
    )}
  </button>
);

export const CommentActivityPanel = ({
  taskId,
  authorId,
  authorName,
  authorAvatar,
}: Props) => {
  const commentCount = useTaskStore((s) => s.tasks[taskId]?.commentCount ?? 0);
  const [tab, setTab] = useState<"comments" | "activity">("comments");

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => setTab(v as "comments" | "activity")}
      className="flex h-full min-h-0 flex-col gap-0"
    >
      <div className="flex shrink-0 items-end justify-start border-b border-border px-4 pt-4">
        <TabsList className="h-auto gap-5 bg-transparent p-0">
          <TabsTrigger value="comments" asChild>
            <TabButton
              active={tab === "comments"}
              onClick={() => setTab("comments")}
              count={commentCount}
            >
              Comments
            </TabButton>
          </TabsTrigger>
          <TabsTrigger value="activity" asChild>
            <TabButton
              active={tab === "activity"}
              onClick={() => setTab("activity")}
            >
              Activity
            </TabButton>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent
        value="comments"
        className="mt-0 flex min-h-0 flex-1 flex-col gap-0"
      >
        <div className="flex-1 overflow-y-auto px-4 py-4 [scrollbar-color:theme(colors.gray.400)_theme(colors.gray.50)] [scrollbar-width:thin]">
          <CommentList taskId={taskId} currentUserId={authorId} />
        </div>
        <div className="shrink-0 border-t border-border bg-background p-3">
          <CommentComposer
            taskId={taskId}
            authorId={authorId}
            authorName={authorName}
            authorAvatar={authorAvatar}
          />
        </div>
      </TabsContent>

      <TabsContent
        value="activity"
        className="mt-0 flex flex-1 flex-col items-center justify-center gap-2 p-6 text-muted-foreground"
      >
        <p className="text-sm">Activity feed coming soon</p>
      </TabsContent>
    </Tabs>
  );
};
