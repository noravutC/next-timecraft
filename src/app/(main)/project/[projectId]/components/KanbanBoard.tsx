import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { BoardColumn, BoardContainer } from "./BoardColumn";
import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  useSensor,
  useSensors,
  KeyboardSensor,
  Announcements,
  UniqueIdentifier,
  TouchSensor,
  MouseSensor,
} from "@dnd-kit/core";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";
import { type Task, TaskCard } from "./TaskCard";
import type { Column } from "./BoardColumn";
import { hasDraggableData } from "../utils";
import { coordinateGetter } from "./multipleContainersKeyboardPreset";
import { StableSortableContext } from "./StableSortableContext";
import { isEqual } from "lodash";

export type ColumnId = ({
    id: string;
    title: string;
  }[])[number]["id"];

interface KanbanBoardProps {
  projectId: string;
  defualtColumns: {
    id: string;
    title: string;
  }[];
  defaultTasks: {
    id: string;
    columnId: string;
    content: string;
  }[];
}
export function KanbanBoard({
  projectId,
  defualtColumns,
  defaultTasks,
}: KanbanBoardProps) {
  const [columns, setColumns] = useState<Column[]>(defualtColumns);
  // const pickedUpTaskColumn = useRef<ColumnId | null>(null);
  const columnsId = useMemo(() => columns.map((col) => col.id), [columns]);

  const [tasks, setTasks] = useState<Task[]>(defaultTasks);

  const [activeColumn, setActiveColumn] = useState<Column | null>(null);

  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const lastOverIdRef = useRef<UniqueIdentifier | null>(null);
  const lastColumnIdRef = useRef<UniqueIdentifier | null>(null);
  const lastDragPairRef = useRef<UniqueIdentifier | null>(null);

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: coordinateGetter,
    })
  );

  const tasksRef = useRef(tasks);
  function onDragStart(event: DragStartEvent) {
    if (!hasDraggableData(event.active)) return;
    const data = event.active.data.current;
    if (data?.type === "Column") {
      setActiveColumn(data.column);
      return;
    }

    if (data?.type === "Task") {
      setActiveTask(data.task);
      return;
    }
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveColumn(null);
    setActiveTask(null);
    lastDragPairRef.current = null;
    lastColumnIdRef.current = null;
    lastOverIdRef.current = null;

    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (!hasDraggableData(active)) return;

    const activeData = active.data.current;

    if (activeId === overId) return;

    const isActiveAColumn = activeData?.type === "Column";
    if (!isActiveAColumn) return;

    setColumns((columns) => {
      const activeColumnIndex = columns.findIndex((col) => col.id === activeId);

      const overColumnIndex = columns.findIndex((col) => col.id === overId);

      return arrayMove(columns, activeColumnIndex, overColumnIndex);
    });
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;
    if (!hasDraggableData(active) || !hasDraggableData(over)) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    const isActiveATask = activeData?.type === "Task";
    const isOverATask = overData?.type === "Task";
    const isOverAColumn = overData?.type === "Column";

    if (!isActiveATask) return;

    const pairKey = `${activeId}->${overId}`;
    if (pairKey === lastDragPairRef.current) return;
    lastDragPairRef.current = pairKey;

    if (!activeTask) return;

    // Clear previous debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new debounce timeout for 300ms
    debounceTimeoutRef.current = setTimeout(() => {
      if (isOverATask) {
        const activeIndex = tasksRef.current.findIndex(t => t.id === activeId);
        const overIndex = tasksRef.current.findIndex(t => t.id === overId);
        if (activeIndex === -1 || overIndex === -1) return;

        const activeTaskData = tasksRef.current[activeIndex];
        const overTaskData = tasksRef.current[overIndex];

        const sameColumn = activeTaskData.columnId === overTaskData.columnId;

        const tasksInSameColumn = tasksRef.current.filter(t => t.columnId === activeTaskData.columnId);
        const activeIndexInCol = tasksInSameColumn.findIndex(t => t.id === activeId);
        const overIndexInCol = tasksInSameColumn.findIndex(t => t.id === overId);

        if (sameColumn && activeIndexInCol === overIndexInCol) return;

        const updatedTasks = [...tasksRef.current];
        if (!sameColumn) {
          updatedTasks[activeIndex] = { ...activeTaskData, columnId: overTaskData.columnId };
        }

        const newTasks = arrayMove(updatedTasks, activeIndex, overIndex);
        if (isEqual(tasksRef.current, newTasks)) return;

        setTasks(newTasks);
      }

      if (isOverAColumn) {
        const activeIndex = tasksRef.current.findIndex(t => t.id === activeId);
        if (activeIndex === -1) return;

        const activeTaskData = tasksRef.current[activeIndex];
        if (activeTaskData.columnId === overId) return;

        if (lastColumnIdRef.current === overId) return;
        lastColumnIdRef.current = overId;

        const updatedTasks = [...tasksRef.current];
        updatedTasks[activeIndex] = { ...activeTaskData, columnId: overId as ColumnId };

        if (isEqual(tasksRef.current, updatedTasks)) return;

        setTasks(updatedTasks);
      }
    }, 150); // 300 ms debounce
  }
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);
  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
    >
      <div className="max-h-[85vh] overflow-hidden flex justify-start gap-2">
        <StableSortableContext items={columnsId}>
          {columns.map((col) => (
            <BoardColumn
              key={col.id}
              projectId={projectId}
              column={col}
              tasks={tasks.filter((task) => task.columnId === col.id)}
            />
          ))}
        </StableSortableContext>
      </div>

      {"document" in window &&
        createPortal(
          <DragOverlay>
            {activeColumn && (
              <BoardColumn
                isOverlay
                projectId={projectId}
                column={activeColumn}
                tasks={tasks.filter(
                  (task) => task.columnId === activeColumn.id
                )}
              />
            )}
            {activeTask && <TaskCard task={activeTask} isOverlay />}
          </DragOverlay>,
          document.body
        )}
    </DndContext>
  );
}