import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { KanbanColumn } from "./KanbanColumn";
import { TaskCard } from "./TaskCard";
import { CreateColumnDialog } from "./CreateColumnDialog";
import { CreateTaskDialog } from "./CreateTaskDialog";
import type { Column, Task, ColumnColor } from "@/types/kanban";

const initialColumns: Column[] = [
  { id: "1", title: "Testing", color: "purple", order: 0 },
  { id: "2", title: "Code Review", color: "pink", order: 1 },
  { id: "3", title: "In Progress", color: "blue", order: 2 },
  { id: "4", title: "Backlog", color: "yellow", order: 3 },
  { id: "5", title: "Done", color: "green", order: 4 },
];

const initialTasks: Task[] = [];

export function KanbanBoard() {
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [createColumnOpen, setCreateColumnOpen] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === "column") {
      setActiveColumn(event.active.data.current.column);
    } else if (event.active.data.current?.type === "task") {
      setActiveTask(event.active.data.current.task);
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
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId);
        const overIndex = tasks.findIndex((t) => t.id === overId);

        if (tasks[activeIndex].columnId !== tasks[overIndex].columnId) {
          tasks[activeIndex].columnId = tasks[overIndex].columnId;
        }

        return arrayMove(tasks, activeIndex, overIndex);
      });
    }

    // Task over column
    if (isActiveTask && isOverColumn) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId);
        tasks[activeIndex].columnId = overId as string;
        return [...tasks];
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveColumn(null);
    setActiveTask(null);

    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveColumn = active.data.current?.type === "column";

    if (isActiveColumn) {
      setColumns((columns) => {
        const activeIndex = columns.findIndex((c) => c.id === activeId);
        const overIndex = columns.findIndex((c) => c.id === overId);
        return arrayMove(columns, activeIndex, overIndex);
      });
    }
  };

  const handleCreateColumn = (title: string, color: ColumnColor) => {
    const newColumn: Column = {
      id: Date.now().toString(),
      title,
      color,
      order: columns.length,
    };
    setColumns([...columns, newColumn]);
  };

  const handleDeleteColumn = (columnId: string) => {
    setColumns(columns.filter((c) => c.id !== columnId));
    setTasks(tasks.filter((t) => t.columnId !== columnId));
  };

  const handleAddTask = (columnId: string) => {
    setSelectedColumnId(columnId);
    setCreateTaskOpen(true);
  };

  const handleCreateTask = (title: string, description: string) => {
    if (!selectedColumnId) return;

    const columnTasks = tasks.filter((t) => t.columnId === selectedColumnId);
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      description,
      columnId: selectedColumnId,
      order: columnTasks.length,
    };
    setTasks([...tasks, newTask]);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter((t) => t.id !== taskId));
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Project</p>
              <h1 className="text-2xl font-bold text-foreground">Kanban Board</h1>
            </div>
            <Button onClick={() => setCreateColumnOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Column
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="container mx-auto px-6 py-6 h-full">
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={columns.map((c) => c.id)}
              strategy={horizontalListSortingStrategy}
            >
              <div className="flex gap-6 h-full pb-6">
                {columns.map((column) => {
                  const columnTasks = tasks.filter((t) => t.columnId === column.id);
                  return (
                    <KanbanColumn
                      key={column.id}
                      column={column}
                      tasks={columnTasks}
                      onAddTask={handleAddTask}
                      onDeleteTask={handleDeleteTask}
                      onDeleteColumn={handleDeleteColumn}
                    />
                  );
                })}
              </div>
            </SortableContext>

            <DragOverlay>
              {activeColumn && (
                <div className="w-80 opacity-50">
                  <KanbanColumn
                    column={activeColumn}
                    tasks={tasks.filter((t) => t.columnId === activeColumn.id)}
                    onAddTask={() => {}}
                    onDeleteTask={() => {}}
                    onDeleteColumn={() => {}}
                  />
                </div>
              )}
              {activeTask && <TaskCard task={activeTask} onDelete={() => {}} />}
            </DragOverlay>
          </DndContext>
        </div>
      </main>

      <CreateColumnDialog
        open={createColumnOpen}
        onOpenChange={setCreateColumnOpen}
        onCreateColumn={handleCreateColumn}
      />

      <CreateTaskDialog
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
        onCreateTask={handleCreateTask}
      />
    </div>
  );
}
