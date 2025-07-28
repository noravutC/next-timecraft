import { useDraggable } from '@dnd-kit/core';
import { usePreview } from './preview-context';

export default function TaskCard({ task }: { task: { id: string; content: string } }) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: task.id });
  const { setActiveTaskId } = usePreview();

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onPointerEnter={() => setActiveTaskId(task.id)}
      onPointerLeave={() => setActiveTaskId(null)}
      className="bg-white rounded shadow p-2 mb-2"
    >
      {task.content}
    </div>
  );
}
