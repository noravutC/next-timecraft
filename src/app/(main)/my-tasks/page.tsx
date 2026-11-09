'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/app-header/app-header';
import { Checkbox } from '@/components/ui/checkbox';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Skeleton } from '@/components/ui/skeleton';
import { useWorkspace } from '@/components/workspace/use-workspace-name';
import { boardUrl } from '@/helper/utils/board-url';
import { myTasksView } from '@/helper/utils/my-tasks';
import { cn } from '@/lib/utils';
import { useProjectStore } from '@/store';
import { MyTaskRow } from './_components/my-task-row';
import { useMyTasks } from './_components/use-my-tasks';

type Grouping = 'due' | 'board';

const GROUPINGS = [
  { value: 'due' as const, label: 'Due date' },
  { value: 'board' as const, label: 'Board' },
];

export default function MyTasksPage() {
  const workspace = useWorkspace();
  const router = useRouter();
  const { tasks, failed } = useMyTasks();
  const projects = useProjectStore((s) => s.projects);
  const [grouping, setGrouping] = useState<Grouping>('due');
  const [showDone, setShowDone] = useState(false);

  const view = useMemo(
    () => myTasksView(tasks ?? [], { grouping, showDone, boards: projects }),
    [tasks, grouping, showDone, projects],
  );

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-background">
      <AppHeader workspace={workspace} current="My tasks" />
      <main className="mx-auto flex w-full max-w-251 flex-col gap-6 px-6 pt-10 pb-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              My tasks
            </h1>
            <p className="text-base text-ink-subtle">
              {tasks
                ? `${view.openCount} open ${view.openCount === 1 ? 'task' : 'tasks'} assigned to you on ${view.boardCount} ${view.boardCount === 1 ? 'board' : 'boards'}.`
                : 'Everything assigned to you, on every board.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-ink-subtle">Group by</span>
            <SegmentedControl<Grouping>
              aria-label="Group by"
              options={GROUPINGS}
              value={grouping}
              onChange={setGrouping}
            />
            <label className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-md border border-line px-3 text-sm text-ink hover:bg-surface-hover">
              <Checkbox
                checked={showDone}
                onCheckedChange={(on) => setShowDone(on === true)}
              />
              Show done
              <span className="font-mono text-xs text-ink-subtle">
                {view.doneCount}
              </span>
            </label>
          </div>
        </div>

        {failed && (
          <p className="rounded-popover border border-line px-4 py-3 text-sm text-ink-muted">
            Couldn’t load your tasks. Reload the page to try again.
          </p>
        )}
        {!tasks && !failed && <Skeleton className="h-80 rounded-xl" />}
        {tasks && view.shownCount === 0 && (
          <p className="rounded-xl border border-dashed border-input px-4 py-10 text-center text-sm text-ink-subtle">
            Nothing assigned to you right now.
          </p>
        )}
        {view.groups.map((group) => (
          <section key={group.key} className="flex flex-col gap-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <span
                className={cn(group.danger ? 'text-danger-text' : 'text-ink')}
              >
                {group.label}
              </span>
              <span className="font-mono text-xs font-normal text-ink-subtle">
                {group.tasks.length}
              </span>
            </h2>
            <ul className="overflow-hidden rounded-xl border border-line">
              {group.tasks.map((task) => (
                <MyTaskRow
                  key={task.id}
                  task={task}
                  board={projects[task.projectId]}
                  onOpen={() =>
                    router.push(
                      boardUrl({ board: task.projectId, task: task.id }),
                    )
                  }
                />
              ))}
            </ul>
          </section>
        ))}
      </main>
    </div>
  );
}
