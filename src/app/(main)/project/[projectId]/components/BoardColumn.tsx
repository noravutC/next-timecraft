import { useSortable } from "@dnd-kit/sortable";
import { useDndContext, type UniqueIdentifier } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useMemo, useState } from "react";
import { Task, TaskCard } from "./TaskCard";
import { cva } from "class-variance-authority";
import { Button } from "@/components/ui/button"
import { Badge, Plus } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { StableSortableContext } from "./StableSortableContext";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useProjectStore } from "@/src/hooks/useProjects";

export interface Column {
  id: UniqueIdentifier;
  title: string;
}

export type ColumnType = "Column";

export interface ColumnDragData {
  type: ColumnType;
  column: Column;
}

interface BoardColumnProps {
  projectId: string;
  column: Column;
  tasks: Task[];
  isOverlay?: boolean;
}

export function BoardColumn({ projectId, column, tasks, isOverlay }: BoardColumnProps) {
  const { createTaskByProjectId } = useProjectStore();
  const [openCreateTask, setOpenCreateTask] = useState(false);

  // const [taskContent, setTaskContent] = useState("");

  const tasksIds = useMemo(() => {
    return tasks.map((task) => task.id);
  }, [tasks]);

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: {
      type: "Column",
      column,
    } satisfies ColumnDragData,
    attributes: {
      roleDescription: `Column: ${column.title}`,
    },
  });

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  };

  const variants = cva(
    "h-[590px] max-h-[590px] w-[350px] max-w-full bg-primary-foreground flex flex-col flex-shrink-0 snap-center",
    {
      variants: {
        dragging: {
          default: "border-1 border-blue-500",
          over: "ring-1 ring-blue-500 opacity-30",
          overlay: "ring-1 ring-blue-500",
        },
      },
    }
  );

  const handleCreateTask = async (content: string) => {
    await createTaskByProjectId(projectId, {
      columnId: '' + column.id,
      task_title: content,
      start_date: new Date(),
      end_date: new Date(),
      time_spent: [],
      create_by: "test insert data",
      assign_to: "test insert data"
    });
    setOpenCreateTask(false);
    console.log('handleCreateTask called with content:', content);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(`bg-gray-100 rounded cursor-pointer`, variants({ dragging: isOverlay ? "overlay" : isDragging ? "over" : undefined }))}
    >
      <div
        className="min-h-[50px] max-h-[60px] w-full flex items-center justify-between px-4 pt-2 select-none"

      >
        <div className="w-[fit-content] font-semibold"
          {...attributes}
          {...listeners}
        > {column.title}</div>
        <Button
          variant={'ghost'}
          onClick={() => setOpenCreateTask(true)}
        >
          <Plus size={10} />
        </Button>

      </div>


      <ScrollArea className="max-h-[500px]">
        <div className="h-[max-content] px-4 pt-2 flex flex-col gap-4">
          <StableSortableContext items={tasksIds}>
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
            {openCreateTask && (
              <CreateTaskCard
                onBlur={() => setOpenCreateTask(false)}
                handleCreateTask={handleCreateTask}
              />
            )}
          </StableSortableContext>
        </div>
      </ScrollArea>
    </div>
  );
}

export function BoardContainer({ children }: { children: React.ReactNode }) {
  const dndContext = useDndContext();

  const variations = cva("px-2 md:px-0 flex lg:justify-center pb-4", {
    variants: {
      dragging: {
        default: "snap-x snap-mandatory",
        active: "snap-none",
      },
    },
  });

  return (
    <ScrollArea
    // className={variations({
    //   dragging: dndContext.active ? "active" : "default",
    // })}
    >
      <div className="flex gap-2 items-center flex-row justify-center">
        {children}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

interface CreateTaskCardProps {
  handleCreateTask: (content: string) => Promise<void>;
  onBlur: () => void;
}

export const CreateTaskCard = ({
  handleCreateTask,
  onBlur,
}: CreateTaskCardProps) => {
  const [taskContent, setTaskContent] = useState("");
  return (
    <div className="rounded-sm bg-white border-blue-200 flex flex-col gap-4 p-4">
      <div className="flex flex-col">
        <Input
          className="!border-none !ring-0 !outline-none !shadow-none focus:!ring-0 focus:!outline-none focus:!border-none"
          autoFocus
          value={taskContent}
          // onBlur={onBlur}
          onBlur={(e) => {
            if (
              e.relatedTarget &&
              (e.relatedTarget as HTMLElement).id === "create-task-button"
            ) {
              return; // อย่า close ถ้าจะคลิกปุ่ม
            }
            onBlur();
          }}
          onChange={(e) => setTaskContent(e.target.value)}
          placeholder="Create a new task..."
        />
        <div className="flex justify-between">
          <div></div>
          <Button
            id="create-task-button"
            size={'sm'}
            onClick={() => {
              handleCreateTask(taskContent);
              setTaskContent("")
              console.log('create task clicked')
            }}
          >
            Create
          </Button>

        </div>
        {/* <span className="text-gray-500 text-sm">Create a new task...</span> */}
        {/* <Button variant={"ghost"} size={null} className="w-6 h-6 cursor-pointer">
          <Plus size={13} />
        </Button> */}
      </div>
      {/* <Badge className="w-full text-center">Click to add a task</Badge> */}
    </div>
  );
}