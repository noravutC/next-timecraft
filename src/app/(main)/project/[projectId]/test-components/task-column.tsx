import { useDroppable } from '@dnd-kit/core';
import { usePreview } from './preview-context';
import TaskCard from './task-card';

type ColumnProps = {
  id: string;
  title: string;
  tasks: { id: string; columnId: string; content: string }[];
};

export default function TaskColumn({ id, title, tasks }: ColumnProps) {
  const { setNodeRef } = useDroppable({ id });
  const { overColumnId, activeTaskId } = usePreview();

  const previewTask = tasks.find((task) => task.id === activeTaskId);

  return (
    <div ref={setNodeRef} className="bg-gray-100 p-4 rounded min-h-[300px] w-[250px]">
      <h2 className="font-bold mb-2">{title}</h2>

      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}

      {overColumnId === id && activeTaskId && previewTask && (
        <div className="mt-2 p-2 bg-white border border-dashed opacity-60">
          👻 {previewTask.content}
        </div>
      )}
    </div>
  );
}
