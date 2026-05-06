'use client';

import { useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import {
  CalendarDays,
  Flag,
  Link,
  MoreHorizontal,
  Tag as TagIcon,
  Timer,
  Trash2,
  User as UserIcon,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProjectAvatar } from '@/components/project/project-avatar';
import { useTaskDetailStore } from '@/store/use-task-detail.store';
import { useTaskStore } from '@/store/use-task.store';
import { useColumnStore } from '@/store/use-column.store';
import { useProjectStore } from '@/store';
import { useUserStore } from '@/store/use-user.store';
import { useAssigneeStore } from '@/store/use-assignee.store';
import { useShallow } from 'zustand/react/shallow';
import { useTaskComments } from '@/store/sync-live-data/useTaskComments';
import { useTaskSubtasks } from '@/store/sync-live-data/useTaskSubtasks';
import { generateFractionBetween } from '@/helper/utils/fraction-string-indexing';
import { formatDateShort, formatRelativeDay } from '@/helper/utils/date-format';
import { withSettingsDefaults } from '@/types/project-settings';
import type { TaskPriority, UpdateTaskPayload } from '@/types';
import { CommentActivityPanel } from './comment-activity-panel';
import { InlineTitle } from './parts/inline-title';
import { InlineDescription } from './parts/inline-description';
import { PriorityPill } from './parts/priority-pill';
import { DueDateCard } from './parts/due-date-card';
import { TagPicker } from './parts/tag-picker';
import { TagChip } from './parts/tag-chip';
import { AssigneePicker } from './parts/assignee-picker';
import { StatusPicker } from './parts/status-picker';
import { EstimatePicker } from './parts/estimate-picker';
import { SubtaskList } from './parts/subtask-list';
import { PropertyRow } from './parts/property-row';
import { StatusDot } from './parts/status-dot';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Label } from '@radix-ui/react-label';

export const TaskDetailDialog = () => {
  const openTaskId = useTaskDetailStore((s) => s.openTaskId);
  const close = useTaskDetailStore((s) => s.close);

  const task = useTaskStore((s) =>
    openTaskId ? s.tasks[openTaskId] : undefined,
  );
  const updateTasks = useTaskStore((s) => s.updateTasks);
  const allTasks = useTaskStore(useShallow((s) => s.tasks));

  const columnsMap = useColumnStore(useShallow((s) => s.columns));

  const projectIsUsing = useProjectStore((s) => s.projectIsUsing);
  const project = useProjectStore((s) =>
    projectIsUsing ? s.projects[projectIsUsing] : null,
  );
  const users = useUserStore(useShallow((s) => s.users));

  const assigneeState = useAssigneeStore(
    useShallow((s) => (openTaskId ? s.byTask[openTaskId] : undefined)),
  );
  const fetchAssignees = useAssigneeStore((s) => s.fetch);
  const setAssignees = useAssigneeStore((s) => s.setAll);

  const { data: session } = useSession();
  const userId = session?.user?.id ?? null;
  const userName = session?.user?.name ?? 'You';
  const userAvatar = session?.user?.image ?? null;

  useTaskComments(openTaskId);
  useTaskSubtasks(openTaskId);

  useEffect(() => {
    if (openTaskId) fetchAssignees(openTaskId);
  }, [openTaskId, fetchAssignees]);

  const settings = useMemo(
    () => withSettingsDefaults(project?.settings ?? null),
    [project?.settings],
  );

  const projectColumns = useMemo(() => {
    if (!project) return [];
    return Object.values(columnsMap)
      .filter((c) => c.projectId === project.id && !c.isDeleted)
      .sort((a, b) => (a.orderFraction < b.orderFraction ? -1 : 1));
  }, [columnsMap, project]);

  const memberCandidates = useMemo(() => {
    if (!project?.members) return [];
    return project.members
      .map((m) => {
        const u = users[m.userId];
        return u
          ? {
              id: u.id,
              name: u.fullName,
              avatar: u.avatar ?? null,
              email: u.email ?? '',
            }
          : null;
      })
      .filter(<T,>(c: T | null): c is T => c !== null);
  }, [project?.members, users]);

  const assignees = assigneeState?.items ?? [];
  const assigneeIds = assignees.map((a) => a.userId);

  const buildAssigneeItems = (ids: string[]) =>
    ids
      .map((id) => {
        const existing = assignees.find((a) => a.userId === id);
        if (existing) return existing;
        const u = users[id];
        if (!u) return null;
        return {
          userId: u.id,
          fullName: u.fullName,
          avatar: u.avatar ?? null,
          email: u.email ?? '',
        };
      })
      .filter(<T,>(it: T | null): it is T => it !== null);

  const persist = (payload: Partial<UpdateTaskPayload>) => {
    if (!task) return;
    updateTasks(
      [task.id],
      [
        {
          id: task.id,
          columnId: task.columnId,
          title: task.title,
          ...payload,
        } as UpdateTaskPayload,
      ],
    );
  };

  const handleStatusChange = (nextColumnId: string) => {
    if (!task || nextColumnId === task.columnId) return;
    const fractions = Object.values(allTasks)
      .filter((t) => t.columnId === nextColumnId && t.id !== task.id)
      .map((t) => t.orderFraction)
      .sort();
    const last = fractions[fractions.length - 1] ?? null;
    const orderFraction = generateFractionBetween(last, null);
    persist({ columnId: nextColumnId, orderFraction });
  };

  const handleCopyLink = () => {
    if (typeof window === 'undefined' || !task) return;
    const url = `${window.location.origin}/project?taskId=${task.id}`;
    navigator.clipboard.writeText(url);
    toast('Link copied');
  };

  const handleArchive = () => {
    if (!task) return;
    persist({ archived: true });
    toast('Task archived', {
      action: { label: 'Undo', onClick: () => persist({ archived: false }) },
    });
    close();
  };

  const dueDate = task?.dueDate ? new Date(task.dueDate) : null;
  const overdueMeta = dueDate
    ? new Date(dueDate).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0)
    : false;

  return (
    <Dialog
      open={Boolean(openTaskId)}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="flex h-[88vh] max-h-[860px] w-[calc(100%-2rem)] max-w-[1200px] flex-col gap-0 overflow-hidden p-0 sm:max-w-[1200px]"
      >
        <DialogTitle className="sr-only">{task?.title ?? 'Task'}</DialogTitle>

        {task && userId ? (
          <>
            <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-2.5">
              <div className="flex min-w-0 flex-1 items-center gap-2 text-sm">
                {project && (
                  <ProjectAvatar
                    project={project}
                    size="size-6"
                    rounded="rounded-md"
                  />
                )}
                <span className="truncate font-medium text-foreground">
                  {project?.name ?? '-'}
                </span>
                <span className="text-muted-foreground">/</span>
                <StatusPicker
                  columns={projectColumns}
                  activeColumnId={task.columnId}
                  onChange={handleStatusChange}
                  size="sm"
                />
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant={'ghost'}
                  className="focus-visibled:ring-0 text-muted-foreground hover:text-foreground"
                  onClick={handleCopyLink}
                  aria-label="Copy link"
                  size={'xs'}
                >
                  <Link className="size-4" />
                </Button>

                {/* <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="More"
                      className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <MoreHorizontal className="size-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem
                      onClick={handleArchive}
                      className="gap-2 text-destructive"
                    >
                      <Trash2 className="size-4" />
                      Delete task
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu> */}
                <Button
                  variant={'ghost'}
                  className="focus-visibled:ring-0 text-muted-foreground hover:text-foreground"
                  onClick={close}
                  aria-label="Close"
                  size={'xs'}
                >
                  <X className="size-4" />
                </Button>
              </div>
            </header>

            <div className="flex min-h-0 flex-1">
              <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto px-10 py-6 [overflow-anchor:none] [scrollbar-color:theme(colors.gray.400)_theme(colors.gray.50)] [scrollbar-width:thin]">
                  <InlineTitle
                    value={task.title}
                    onCommit={(title) => persist({ title })}
                  />

                  <div className="mt-5 rounded-lg border border-border">
                    <PropertyRow
                      icon={
                        <StatusDot color={columnsMap[task.columnId]?.color} />
                      }
                      label="Status"
                    >
                      <StatusPicker
                        columns={projectColumns}
                        activeColumnId={task.columnId}
                        onChange={handleStatusChange}
                      />
                    </PropertyRow>

                    <PropertyRow
                      icon={<Flag className="size-4" />}
                      label="Priority"
                    >
                      <PriorityPill
                        value={task.priority as TaskPriority}
                        onChange={(p) => persist({ priority: p })}
                        variant="plain"
                      />
                    </PropertyRow>

                    <PropertyRow
                      icon={<UserIcon className="size-4" />}
                      label="Assignees"
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        {assignees.map((a) => (
                          <span
                            key={a.userId}
                            className="group inline-flex items-center gap-1.5 rounded-full bg-background py-0.5 pr-1.5 pl-0.5 text-sm"
                          >
                            <Avatar className="size-5">
                              <AvatarImage
                                src={a.avatar ?? undefined}
                                alt={a.fullName}
                              />
                              <AvatarFallback className="bg-violet-500 text-xs font-semibold text-white">
                                {a.fullName.charAt(0).toUpperCase() || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate">
                              {a.fullName.split(' ')[0]}.
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setAssignees(
                                  task.id,
                                  buildAssigneeItems(
                                    assigneeIds.filter(
                                      (id) => id !== a.userId,
                                    ),
                                  ),
                                )
                              }
                              aria-label={`Remove ${a.fullName}`}
                              className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                              <X className="size-3" />
                            </button>
                          </span>
                        ))}
                        <AssigneePicker
                          candidates={memberCandidates}
                          selectedIds={assigneeIds}
                          onChange={(ids) =>
                            setAssignees(task.id, buildAssigneeItems(ids))
                          }
                        />
                      </div>
                    </PropertyRow>

                    <PropertyRow
                      icon={<CalendarDays className="size-4" />}
                      label="Due date"
                    >
                      <DueDateCard
                        value={dueDate}
                        onChange={(d) => persist({ dueDate: d })}
                      />
                    </PropertyRow>

                    <PropertyRow
                      icon={<TagIcon className="size-4" />}
                      label="Labels"
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        {task.tags.map((tag) => (
                          <TagChip
                            key={tag}
                            tag={tag}
                            size="sm"
                            tagColors={settings.tagColors}
                            onRemove={() =>
                              persist({
                                tags: task.tags.filter((t) => t !== tag),
                              })
                            }
                          />
                        ))}
                        <TagPicker
                          projectTags={project?.tags ?? []}
                          selectedTags={task.tags}
                          tagColors={settings.tagColors}
                          onChange={(tags) => persist({ tags })}
                        />
                      </div>
                    </PropertyRow>

                    <PropertyRow
                      icon={<Timer className="size-4" />}
                      label="Estimate"
                    >
                      <EstimatePicker
                        value={task.estimatedHours ?? 0}
                        onChange={(estimatedHours) =>
                          persist({ estimatedHours })
                        }
                      />
                    </PropertyRow>
                  </div>

                  <hr className="my-5 border-border" />

                  <div>
                    <Label className="mb-2 text-sm font-semibold text-muted-foreground uppercase">
                      Description
                    </Label>
                    <InlineDescription
                      value={task.description}
                      onCommit={(description) => persist({ description })}
                    />
                  </div>

                  <hr className="my-5 border-border" />

                  <SubtaskList taskId={task.id} />
                </div>
              </main>

              <aside className="flex w-[420px] shrink-0 flex-col overflow-hidden border-l border-border bg-gray-50/40">
                <CommentActivityPanel
                  taskId={task.id}
                  authorId={userId}
                  authorName={userName}
                  authorAvatar={userAvatar}
                />
              </aside>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Loading…
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
