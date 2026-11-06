'use client';

import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Loader } from '@/components/ui/loader';
import { CommentActivityPanel } from './comment-activity-panel';
import { CommentComposer } from './comment-composer';
import { InlineTitle } from './parts/inline-title';
import { InlineDescription } from './parts/inline-description';
import { SubtaskList } from './parts/subtask-list';
import { TaskSheetHeader } from './parts/task-sheet-header';
import { TaskProperties } from './parts/task-properties';
import { useTaskDetail } from './use-task-detail';
import { useTaskActions } from './use-task-actions';
import { TaskSheetMenu } from './parts/task-sheet-menu';

const Divider = () => <div aria-hidden className="my-5 h-px bg-line-soft" />;

/** Fields keep their own Escape (cancel an edit) instead of closing the sheet. */
const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  Boolean(target.closest('input, textarea, [contenteditable="true"]'));

export const TaskDetailSheet = () => {
  const {
    openTaskId,
    close,
    task,
    project,
    projectColumns,
    memberCandidates,
    settings,
    assignees,
    assigneeIds,
    setAssignees,
    buildAssigneeItems,
    userId,
    userName,
    userAvatar,
    dueDate,
    persist,
    handleStatusChange,
    handleCopyLink,
    readOnly,
    canComment,
    canReact,
    canManageOwnComments,
    commentBlockedNote,
  } = useTaskDetail();
  const taskActions = useTaskActions(task);

  return (
    <Sheet
      open={Boolean(openTaskId)}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <SheetContent
        side="right"
        showCloseButton={false}
        aria-describedby={undefined}
        onEscapeKeyDown={(e) => {
          if (isTypingTarget(e.target)) e.preventDefault();
        }}
        className="gap-0 sm:max-w-180"
      >
        <SheetTitle className="sr-only">{task?.title ?? 'Task'}</SheetTitle>

        {task && userId ? (
          <>
            <TaskSheetHeader
              project={project}
              columns={projectColumns}
              activeColumnId={task.columnId}
              onStatusChange={handleStatusChange}
              onCopyLink={handleCopyLink}
              readOnly={readOnly}
              menu={<TaskSheetMenu actions={taskActions} />}
            />

            <div className="scrollbar-thin-y scrollbar-light min-h-0 flex-1 overflow-y-auto px-5 pt-6 pb-6 [overflow-anchor:none] sm:px-8 sm:pt-7">
              <InlineTitle
                value={task.title}
                onCommit={(title) => persist({ title })}
                className="mb-5"
                readOnly={readOnly}
              />

              <TaskProperties
                task={task}
                columns={projectColumns}
                onStatusChange={handleStatusChange}
                persist={persist}
                dueDate={dueDate}
                assignees={assignees}
                assigneeIds={assigneeIds}
                candidates={memberCandidates}
                onAssigneesChange={(ids) =>
                  setAssignees(task.id, buildAssigneeItems(ids))
                }
                projectTags={project?.tags ?? []}
                tagColors={settings.tagColors}
                readOnly={readOnly}
              />

              <Divider />

              <section>
                <h3 className="mb-2 text-sm leading-5 font-semibold text-ink">
                  Description
                </h3>
                <InlineDescription
                  value={task.description}
                  onCommit={(description) => persist({ description })}
                  readOnly={readOnly}
                />
              </section>

              <Divider />

              <SubtaskList taskId={task.id} readOnly={readOnly} />

              <CommentActivityPanel
                taskId={task.id}
                currentUserId={userId}
                canReact={canReact}
                canManageOwn={canManageOwnComments}
              />
            </div>

            <div className="shrink-0 border-t border-line bg-background px-5 pt-3 pb-4">
              {canComment ? (
                <CommentComposer
                  taskId={task.id}
                  authorId={userId}
                  authorName={userName}
                  authorAvatar={userAvatar}
                />
              ) : (
                <p className="rounded-lg bg-surface px-3.5 py-3 text-sm text-ink-muted">
                  {commentBlockedNote}
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <Loader size="lg" />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
