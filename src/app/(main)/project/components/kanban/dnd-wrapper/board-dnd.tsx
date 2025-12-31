import { ColumnCache, CombineColumnTask } from '@/types/column';
import { Task } from '@/types';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors, DragStartEvent, DragOverEvent, DragEndEvent, pointerWithin } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useMemo, useState } from 'react';
import { ColumnDnd } from './column-dnd';
import { TaskDnd } from './task-dnd';
import { useBoardStore, useTaskStore } from '@/hooks';

interface BoardDndProps {
    projectId: string;
}
export const BoardDnd = ({ projectId }: BoardDndProps) => {
    const { columnCombineTasks } = useBoardStore();
    const { tasks, moveTaskState } = useTaskStore();
    const [activeColumn, setActiveColumn] = useState<CombineColumnTask | null>(null);
    const [activeTask, setActiveTask] = useState<Task | null>(null);

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
        const activeColumnId = taskActive.columnId;
        let overColumnId: string | null = null;
        // Task over task
        if (isActiveTask && isOverTask) {
            const overTask = tasks[overId];
            if  (overTask) overColumnId = overTask.columnId;
            moveTaskState(activeId, overTask.columnId, overTask._id);
            // No action on drag over for now
            console.log('Drag over task in same column');
            // return;
        } else if (isOverColumn) {
            overColumnId = overId;
        }
        if (!overColumnId) return;
        // Task over different column
        if (activeColumnId !== overColumnId) {
            const overTask = tasks[overId];
            moveTaskState(activeId, overColumnId, overTask?._id);
        }
        if (isActiveTask && isOverColumn) {
            // No action on drag over for now
            console.log('Drag over column');
            // return;
        }
    }
    const handleDragEnd = (event: DragEndEvent) => {
        setActiveColumn(null);
        setActiveTask(null);
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
                // หาการชนด้วย pointer ก่อน ถ้าไม่เจอค่อยใช้ closestCorners
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