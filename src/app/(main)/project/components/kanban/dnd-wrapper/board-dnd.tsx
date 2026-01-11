import { CombineColumnTask } from '@/types/column';
import { Task } from '@/types';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors, DragStartEvent, DragOverEvent, DragEndEvent, pointerWithin } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useMemo, useRef, useState } from 'react';
import { ColumnDnd } from './column-dnd';
import { TaskDnd } from './task-dnd';
import { useBoardStore, useTaskStore } from '@/hooks';
import { useShallow } from 'zustand/react/shallow';


interface BoardDndProps {
    projectId: string;
}
export const BoardDnd = ({ projectId }: BoardDndProps) => {
    // const { columnCombineTasks } = useBoardStore();
    // const { tasks, dropTask, moveTaskState } = useTaskStore();
    const { columnCombineTasks } = useBoardStore(useShallow(state => ({
        columnCombineTasks: state.columnCombineTasks
    })));
    const moveTaskState = useTaskStore(state => state.moveTaskState);
    const moveTaskTo = useTaskStore(state => state.moveTaskTo);
    const tasks = useTaskStore(useShallow(state => state.tasks));
    const dropTask = useTaskStore(state => state.dropTask);
    const [activeColumn, setActiveColumn] = useState<CombineColumnTask | null>(null);
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const activeTaskSnapshotRef = useRef<Task | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );
    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        if (active.data.current?.type === "column") {
            setActiveColumn(active.data.current.column);
        } else if (active.data.current?.type === "task") {
            setActiveTask(active.data.current.task);
            activeTaskSnapshotRef.current = active.data.current.task;
        }
    };
    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        if (activeId === overId) return;
        const taskActive = tasks[activeId];
        const isActiveTask = active.data.current?.type === "task";
        const isOverTask = over.data.current?.type === "task";
        const isOverColumn = over.data.current?.type === "column";

        if (!isActiveTask || !taskActive) return;
        let overColumnId: string | null = null;
        // Task over task
        if (isActiveTask && isOverTask) {
            const overTask = tasks[overId];
            if  (overTask) overColumnId = overTask.columnId;
            moveTaskState(activeId, overTask.columnId, overTask._id);
            return;
        } else if (isOverColumn) {
            overColumnId = overId;
        }
        if (!overColumnId) return;
        // Task over different column
        if (isActiveTask && isOverColumn) {
            const overTask = tasks[overId];
            moveTaskState(activeId, overColumnId, overTask?._id);
            return;
        }
    }
    const handleDragEnd = (event: DragEndEvent) => {
        setActiveColumn(null);
        setActiveTask(null);
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        if (activeId === overId) return;
        const taskActive = tasks[activeId];
        const isActiveTask = active.data.current?.type === "task";
        const isOverTask = over.data.current?.type === "task";
        const isOverColumn = over.data.current?.type === "column";

        if (!isActiveTask || !taskActive) return;

        const activeTaskData = active.data.current?.task as Task | undefined;
        const activeTaskSnapshot = activeTaskSnapshotRef.current ?? activeTaskData;
        const latestTasks = useTaskStore.getState().tasks;
        const movedTask = latestTasks[activeId] ?? taskActive;
        const boardState = useBoardStore.getState();

        const sourceColumnId = activeTaskSnapshot?.columnId ?? taskActive.columnId;
        const sourceOrder = activeTaskSnapshot?.order ?? taskActive.order;
        let destinationColumnId = movedTask.columnId;
        let destinationOrder = movedTask.order;

        if (isOverTask) {
            const overTask = tasks[overId] ?? (over.data.current?.task as Task | undefined);
            if (!overTask) return;
            destinationColumnId = overTask.columnId;
            destinationOrder = overTask.order;
        } else if (isOverColumn) {
            destinationColumnId = overId;
            const destTasks = boardState.columnCombineTasks[destinationColumnId]?.tasks ?? [];
            const lastOrder = destTasks.length > 0
                ? Math.max(...destTasks.map((t) => t.order))
                : 0;
            destinationOrder = lastOrder + 1;
        }

        if (sourceColumnId === destinationColumnId && sourceOrder === destinationOrder) {
            return;
        }

        moveTaskTo(projectId, activeId, sourceColumnId, destinationColumnId, destinationOrder);
        activeTaskSnapshotRef.current = null;
    }
    const colProps = useMemo(() => {
        const colsCombineTasks = Object.values(columnCombineTasks).filter((item) => item.projectId === projectId);
        const colKeys = colsCombineTasks.map((col) => col._id);
        return {
            colKeys,
            colsCombineTasks,
        }
    }, [columnCombineTasks, projectId])

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={(args) => {
                const pointerCollisions = pointerWithin(args);
                if (pointerCollisions.length > 0) return pointerCollisions;
                return closestCorners(args);
            }}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={colProps.colKeys}
                strategy={horizontalListSortingStrategy}
            >
                <div className='max-w-full h-full overflow-y-hidden scrollbar-thin-x overflow-x-auto'>
                    <div className='w-full min-w-max flex gap-6 h-full p-4'>
                        {colProps.colsCombineTasks.map((col) => (
                            <ColumnDnd key={col._id} colTasks={col} />
                        ))}
                    </div>
                </div>
            </SortableContext>
            <DragOverlay>
                {activeColumn && (
                    <ColumnDnd colTasks={activeColumn} />
                )}
                {activeTask && (
                    <TaskDnd task={activeTask} />
                )}
            </DragOverlay>
        </DndContext>
    )
}
