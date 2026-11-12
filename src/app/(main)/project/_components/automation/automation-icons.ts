import {
  Archive,
  ArrowRightLeft,
  Bell,
  CalendarClock,
  CalendarDays,
  CircleCheckBig,
  Clock,
  Hourglass,
  LayoutTemplate,
  ListChecks,
  MessageCircle,
  Plus,
  ChartNoAxesColumnIncreasing,
  Repeat,
  Tag,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import type { RuleActionType, RuleTriggerType } from '@/types';

/** The mark each kind of trigger wears, in lists and in the editor. */
export const TRIGGER_ICONS: Record<RuleTriggerType, LucideIcon> = {
  task_created: Plus,
  task_moved: ArrowRightLeft,
  task_finished: CircleCheckBig,
  task_assigned: UserPlus,
  label_added: Tag,
  subtasks_done: ListChecks,
  due_soon: CalendarDays,
  due_passed: Clock,
  task_idle: Hourglass,
  schedule: Repeat,
};

export const ACTION_ICONS: Record<RuleActionType, LucideIcon> = {
  move: ArrowRightLeft,
  assign: UserPlus,
  set_priority: ChartNoAxesColumnIncreasing,
  set_due: CalendarClock,
  add_label: Tag,
  remove_label: Tag,
  comment: MessageCircle,
  notify: Bell,
  create_task: LayoutTemplate,
  archive: Archive,
};
