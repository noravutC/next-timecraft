'use client';

import { ChevronDown, LayoutTemplate, Plus, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { useShallow } from 'zustand/react/shallow';
import { useOpenTask } from '@/components/task-detail/use-open-task';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavStore, useProjectStore } from '@/store';
import { useAutomationStore } from '@/store/use-automation.store';
import type { TaskTemplate } from '@/types';
import type { TColumn } from './data';

/**
 * "New task" as it always was, and beside it an arrow that starts a task
 * from one of the board's templates instead, in the first column.
 */
export const NewTaskButton = ({
  columns,
  disabled,
  title,
}: {
  columns: TColumn[];
  disabled: boolean;
  /** why it is disabled, when it is */
  title?: string;
}) => {
  const requestNewTask = useNavStore((s) => s.requestNewTask);
  const projectId = useProjectStore((s) => s.projectIsUsing);
  const templates = useAutomationStore(
    useShallow((s) =>
      s.projectId === projectId ? Object.values(s.templates) : [],
    ),
  );
  const openTask = useOpenTask();
  const first = columns[0];

  const load = (open: boolean) => {
    if (!open || !projectId) return;
    useAutomationStore
      .getState()
      .fetchTemplates(projectId)
      // the menu still offers "Manage templates"
      .catch(() => {});
  };
  const start = async (template: TaskTemplate) => {
    if (!first) return;
    try {
      const task = await useAutomationStore
        .getState()
        .createFromTemplate(template.id, first.id);
      if (!task) return;
      toast.success(`Created “${task.title}” in ${first.title}`, {
        action: { label: 'Open', onClick: () => void openTask(task.id) },
      });
    } catch (error) {
      toast.error(
        (error as { message?: string })?.message ?? 'Could not create the task',
      );
    }
  };
  const manage = () => {
    useAutomationStore.getState().setIntent({ section: 'templates' });
    useNavStore.getState().setBoardView('automation');
  };

  return (
    <ButtonGroup>
      <Button
        size="sm"
        onClick={requestNewTask}
        disabled={disabled}
        title={title}
      >
        <Plus className="size-3.75 stroke-2" />
        <span className="sr-only sm:not-sr-only">New task</span>
      </Button>
      <DropdownMenu onOpenChange={load}>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            disabled={disabled}
            aria-label="New task from a template"
            className="ml-px px-1.5 has-[>svg]:px-1.5"
          >
            <ChevronDown className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="text-xs font-normal text-ink-subtle">
            From a template
          </DropdownMenuLabel>
          {templates.length === 0 ? (
            <p className="px-2 py-1.5 text-sm leading-5 text-ink-subtle">
              No templates yet. Any task can be saved as one from its menu.
            </p>
          ) : (
            templates.map((template) => (
              <DropdownMenuItem
                key={template.id}
                onSelect={() => void start(template)}
              >
                <LayoutTemplate />
                <span className="truncate">{template.title}</span>
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={manage}>
            <Settings2 />
            Manage templates
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  );
};
