'use client';

import { Badge } from "@/components/ui/badge";
import { ColumnCache } from "@/types";
import React, { useEffect, useMemo, useRef, useState } from "react";
// import { TaskCard } from "./task-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Plus, X } from "lucide-react";
import { PreviewTaskForm } from "../ui-customize/preview-task-form";
import { useBoardStore, useTaskStore } from "@/hooks";
import { cn } from "@/lib/utils";
import { hexToRgba } from "@/helper/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BoardTools } from "../ui-customize/board-tools";
import { BoardInsert } from "../ui-customize/board-insert";
// DND KIT
import { CSS } from '@dnd-kit/utilities';
import { useSortable } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { TaskDnd } from "./task-dnd";

interface BoardColumnProps {
  initailColumn: ColumnCache;
}


export const ColumnDnd = React.memo(({ initailColumn }: BoardColumnProps) => {
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: initailColumn._id,
    data: { type: "column", initailColumn },
  });

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: initailColumn._id,
    data: { type: "column", initailColumn },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  // --------------------------------------------------------------------------------
  const { updateColumn, status: statusBoard } = useBoardStore();
  const { tasks: stateTasks, status: statusTask } = useTaskStore();
  const column = useBoardStore(state => state.columns[initailColumn._id] || initailColumn);
  const [openTaskForm, setOpenTaskForm] = useState(false);

  const [onFocusBoardTools, setOnFocusBoardTools] = useState<{ hover: boolean; active: boolean; }>({ hover: false, active: false });
  const [editBoard, setEditBoard] = useState<{
    value?: string;
    isEdit: boolean;
  }>({
    value: column.name,
    isEdit: false,
  });
  const [insertDirection, setInsertDirection] = useState<'left' | 'right' | null>(null);

  if (!column) return null;
  const tasks = (Object.values(stateTasks) || []).filter((t) => t.columnId === column._id);

  const isFetch = useMemo(() => {
    return statusBoard === 'fetching' || (statusTask === 'fetching');
  }, [statusBoard, statusTask]);

  const targetOpacity = 0.6;
  const backgroundStyle = column.color
    ? { background: hexToRgba(column.color, targetOpacity) }
    : {};

  const handleOpenTaskForm = () => {
    setOpenTaskForm(!openTaskForm);
  }

  const handleUpdateBoardValues = async () => {
    if (column._id) {
      await updateColumn(column._id, { name: editBoard.value ?? column.name });
      setEditBoard((prev) => ({ ...prev, isEdit: false }));
    } else {

    }
  }

  useEffect(() => {
    if (editBoard.isEdit) {
      setEditBoard((prev) => ({ ...prev, value: column.name }));
    }
  }, [column, editBoard.isEdit]);

  return (
    <div
      ref={setSortableRef}
      style={style}
      className="flex gap-4"
    >
      <BoardInsert currentOrder={column.order} insertDirection={insertDirection} setInsertDirection={setInsertDirection}>
        <div
          className={cn('max-h-[450px] h-full min-h-[150px] max-w-[250px] min-w-[250px] z-2 bg-white',
            'flex flex-col flex-shrink-0 rounded-md border'
          )}
          data-board-column
        >
          <div className={cn('flex h-12 items-center justify-between flex-shrink-0 p-3 border-b rounded-t-md', editBoard && '!p-2')}
            style={backgroundStyle}
          >
            {!editBoard.isEdit ? (
              <div
                className="flex justify-between items-center w-full"
                onMouseEnter={() => setOnFocusBoardTools(prev => ({ ...prev, hover: true }))}
                onMouseLeave={() => setOnFocusBoardTools(prev => ({ ...prev, hover: false }))}
              >
                <div
                  className="font-semibold text-sm flex-1 cursor-text"
                  onClick={() => setEditBoard({ isEdit: true })}
                  // Trigger for move column
                  {...attributes}
                  {...listeners}
                >
                  {column.name}
                </div>
                <div className="flex gap-2 items-center justify-end">

                  <Badge variant={'outline'} className="rounded-full text-xs bg-white text-gray-500 flex items-center text-start group-hover:hidden">
                    <div>{tasks.length}{column.wipLimit > 0 && `/${column.wipLimit}`}</div>
                    <div>task</div>
                  </Badge>
                  <BoardTools
                    column={column}
                    onFocusBoardTools={onFocusBoardTools}
                    setOnFocusBoardTools={setOnFocusBoardTools}
                    setInsertDirection={setInsertDirection}
                  />
                </div>
              </div>
            ) : (
              <div className="relative w-full">
                <Input
                  autoFocus
                  className="bg-white text-md font-semibold w-full pr-12"
                  value={editBoard.value ?? ''}
                  onChange={(e) => setEditBoard((prev) => ({ ...prev, value: e.target.value }))}
                  onBlur={() => setEditBoard({ isEdit: false })}
                />
                <div className="absolute bottom-[-35px] max-w-40 w-40 min-h-fit flex justify-end gap-1 right-0">
                  <Button variant={'white'} size={'sm'} onClick={handleUpdateBoardValues}>
                    <Check className="size-3 text-gray-600" strokeWidth={3} />
                  </Button>
                  <Button variant={'white'} size={'sm'} onClick={() => setEditBoard((prev) => ({ ...prev, isEdit: false }))}>
                    <X className="size-3 text-gray-600" strokeWidth={3} />
                  </Button>
                </div>
              </div>
            )}


          </div>
          <div
            className='flex-1 overflow-y-auto scrollbar-thin-y space-y-2'
          >
            {
              isFetch ? (
                <div className="p-2 flex flex-col gap-2">
                  <Skeleton className="h-[100px] w-full" />
                  <Skeleton className="h-[100px] w-full" />
                  <Skeleton className="h-[100px] w-full" />
                </div>
              ) : (
                <>
                  <div
                    ref={setDroppableRef}
                    className="p-2 flex flex-col gap-2"
                  >
                    {tasks.map((task) => (
                      <TaskDnd key={task._id} task={task} />
                    ))}
                    {openTaskForm && (
                      <PreviewTaskForm
                        colId={column._id}
                        handleOpenTaskForm={handleOpenTaskForm}
                      />
                    )}
                  </div>
                </>
              )}
          </div>
          <div className="h-[45px] w-full flex items-center justify-start gap-2 cursor-pointer pb-1">
            <div className="h-full w-full flex gap-2 items-center rounded m-1 duration-300 transition-all hover:bg-gray-100 px-2"
              onClick={handleOpenTaskForm}
            >
              <Plus size={14} />
              <p className="text-sm font-[500] text-gray-600">Create</p>
            </div>
          </div>
        </div>
      </BoardInsert>
    </div>
  );
})