'use client';

import { Calendar, CircleDot, Tag, Timer, User } from 'lucide-react';
import type {
  ColumnCache,
  TaskCache,
  TaskPriority,
  UpdateTaskPayload,
} from '@/types';
import type { ProjectSettings } from '@/types/project-settings';
import { PriorityBars } from '@/components/task-meta/priority-bars';
import { UserAvatar } from '@/components/people/user-avatar';
import { shortName } from '@/helper/utils/person-name';
import { PropertyRow } from './property-row';
import { StatusPicker } from './status-picker';
import { PriorityPicker } from './priority-picker';
import { DueDatePicker } from './due-date-picker';
import { TagChip } from './tag-chip';
import { TagPicker } from './tag-picker';
import { AssigneePicker, type AssigneeCandidate } from './assignee-picker';
import { EstimatePicker } from './estimate-picker';

interface TaskAssignee {
  userId: string;
  fullName: string;
  avatar: string | null;
}

interface TaskPropertiesProps {
  task: TaskCache;
  columns: ColumnCache[];
  onStatusChange: (columnId: string) => void;
  persist: (payload: Partial<UpdateTaskPayload>) => void;
  dueDate: Date | null;
  assignees: TaskAssignee[];
  assigneeIds: string[];
  candidates: AssigneeCandidate[];
  onAssigneesChange: (ids: string[]) => void;
  projectTags: string[];
  tagColors: Required<ProjectSettings>['tagColors'];
}

/** Status · Priority · Assignees · Due date · Labels · Estimate */
export const TaskProperties = ({
  task,
  columns,
  onStatusChange,
  persist,
  dueDate,
  assignees,
  assigneeIds,
  candidates,
  onAssigneesChange,
  projectTags,
  tagColors,
}: TaskPropertiesProps) => (
  <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-x-2 gap-y-0.5 sm:grid-cols-[8rem_minmax(0,1fr)]">
    <PropertyRow icon={<CircleDot />} label="Status">
      <StatusPicker
        columns={columns}
        activeColumnId={task.columnId}
        onChange={onStatusChange}
      />
    </PropertyRow>

    <PropertyRow
      icon={
        <PriorityBars priority="high" color="var(--ink-faint)" decorative />
      }
      label="Priority"
    >
      <PriorityPicker
        value={task.priority as TaskPriority}
        onChange={(priority) => persist({ priority })}
      />
    </PropertyRow>

    <PropertyRow icon={<User />} label="Assignees">
      <div className="flex flex-wrap items-center gap-1.5 py-0.75">
        {assignees.map((a) => (
          <span
            key={a.userId}
            className="inline-flex h-7 items-center gap-1.5 rounded-full border border-line pr-2.5 pl-0.75 text-sm text-ink"
          >
            <UserAvatar
              name={a.fullName}
              image={a.avatar}
              seed={a.userId}
              size="sm"
            />
            {shortName(a.fullName)}
          </span>
        ))}
        <AssigneePicker
          candidates={candidates}
          selectedIds={assigneeIds}
          onChange={onAssigneesChange}
        />
      </div>
    </PropertyRow>

    <PropertyRow icon={<Calendar />} label="Due date">
      <DueDatePicker
        value={dueDate}
        onChange={(d) => persist({ dueDate: d })}
      />
    </PropertyRow>

    <PropertyRow icon={<Tag />} label="Labels">
      <div className="flex flex-wrap items-center gap-1.5 py-0.75">
        {task.tags.map((tag) => (
          <TagChip key={tag} tag={tag} tagColors={tagColors} />
        ))}
        <TagPicker
          projectTags={projectTags}
          selectedTags={task.tags}
          tagColors={tagColors}
          onChange={(tags) => persist({ tags })}
        />
      </div>
    </PropertyRow>

    <PropertyRow icon={<Timer />} label="Estimate">
      <EstimatePicker
        value={task.estimatedHours ?? 0}
        onChange={(estimatedHours) => persist({ estimatedHours })}
      />
    </PropertyRow>
  </div>
);
