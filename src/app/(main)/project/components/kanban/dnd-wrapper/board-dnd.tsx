import { ColumnCache } from '@/types/column';
import { Task } from '@/types';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors, DragStartEvent, DragOverEvent, DragEndEvent, pointerWithin } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useState } from 'react';
import { ColumnDnd } from './column-dnd';
import { TaskDnd } from './task-dnd';

interface BoardDndProps {
    initailColumns: ColumnCache[]
}
export const BoardDnd = ({ initailColumns }: BoardDndProps) => {
    const [activeColumn, setActiveColumn] = useState<ColumnCache | null>(null);
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

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        const isActiveTask = active.data.current?.type === "task";
        const isOverTask = over.data.current?.type === "task";
        const isOverColumn = over.data.current?.type === "column";

        if (!isActiveTask) return;
        // Task over task
        if (isActiveTask && isOverTask) {
            // No action on drag over for now
            console.log('Drag over task in same column');
            // return;
        }
        // Task over column
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
                items={initailColumns.map((c) => c._id)}
                strategy={horizontalListSortingStrategy}
            >
                <div className='max-w-full h-full overflow-y-hidden scrollbar-thin-x overflow-x-auto'>
                    <div className='w-full min-w-max flex gap-6 h-full p-4'>
                        {initailColumns.map((col) => (
                            <ColumnDnd key={col._id} initailColumn={col} />
                        ))}
                    </div>
                </div>
            </SortableContext>
            <DragOverlay>
                {activeColumn && (
                    <ColumnDnd initailColumn={activeColumn} />
                )}
                {activeTask && (
                    <TaskDnd task={activeTask} />
                )}
            </DragOverlay>
        </DndContext>
    )
}