'use client';

import { useEffect, useState, type RefObject } from 'react';
import {
  draggable,
  dropTargetForElements,
  monitorForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import type { TaskCache } from '@/types';

const CALENDAR_TASK = 'calendar-task';

type CalendarDragData = { type: typeof CALENDAR_TASK; task: TaskCache };

const isCalendarDrag = (
  data: Record<string | symbol, unknown>,
): data is CalendarDragData => data.type === CALENDAR_TASK;

/** A chip or a "No due date" card that can be dragged onto a day. */
export function useCalendarDraggable(
  ref: RefObject<HTMLElement | null>,
  task: TaskCache,
  enabled: boolean,
) {
  const [dragging, setDragging] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;
    return draggable({
      element,
      getInitialData: (): CalendarDragData => ({ type: CALENDAR_TASK, task }),
      onDragStart: () => setDragging(true),
      onDrop: () => setDragging(false),
    });
  }, [ref, task, enabled]);
  return dragging;
}

/** A day cell that takes a dropped task; true while one is over it. */
export function useCalendarDayTarget(
  ref: RefObject<HTMLElement | null>,
  day: Date,
) {
  const [over, setOver] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    return dropTargetForElements({
      element,
      canDrop: ({ source }) => isCalendarDrag(source.data),
      getData: () => ({ day: day.toISOString() }),
      onDragEnter: () => setOver(true),
      onDragLeave: () => setOver(false),
      onDrop: () => setOver(false),
    });
  }, [ref, day]);
  return over;
}

/** Dropping a task on a day gives it that due date. */
export function useCalendarDrop(onMove: (task: TaskCache, day: Date) => void) {
  useEffect(
    () =>
      monitorForElements({
        canMonitor: ({ source }) => isCalendarDrag(source.data),
        onDrop: ({ source, location }) => {
          const target = location.current.dropTargets[0];
          if (!target || !isCalendarDrag(source.data)) return;
          const day = target.data.day;
          if (typeof day === 'string') onMove(source.data.task, new Date(day));
        },
      }),
    [onMove],
  );
}
