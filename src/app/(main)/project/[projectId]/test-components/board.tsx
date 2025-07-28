import { DndContext } from '@dnd-kit/core';
import TaskColumn from './task-column';
import { PreviewProvider, usePreview } from './preview-context';

type Props = {
  columns: { id: string; title: string }[];
  tasks: { id: string; columnId: string; content: string }[];
};

export default function Board({ columns, tasks }: Props) {
  const { setOverColumnId, setActiveTaskId } = usePreview();

  return (
    <DndContext
      onDragStart={({ active }) => {
        setActiveTaskId(active.id as string);
      }}
      onDragOver={({ over }) => {
        setOverColumnId(over?.id as string ?? null);
      }}
      onDragEnd={() => {
        setOverColumnId(null);
        setActiveTaskId(null);
      }}
    >
      <div className="flex gap-4 overflow-x-auto">
        {columns.map((column) => (
          <TaskColumn
            key={column.id}
            id={column.id}
            title={column.title}
            tasks={tasks.filter((task) => task.columnId === column.id)}
          />
        ))}
      </div>
    </DndContext>
  );
}
