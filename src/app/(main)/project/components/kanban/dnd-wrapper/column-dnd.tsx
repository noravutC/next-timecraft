'use client';

import { Badge } from "@/components/ui/badge";
import { CombineColumnTask } from "@/types"; // Check imports
import React, { useEffect, useMemo, useState } from "react";
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
import { useShallow } from "zustand/react/shallow"; // Import useShallow

interface BoardColumnProps {
  colTasks: CombineColumnTask;
}

interface ColumnContentProps extends BoardColumnProps {
  isOverlay?: boolean;
  dndAttributes?: any;
  dndListeners?: any;
  dndRef?: (node: HTMLElement | null) => void;
  style?: React.CSSProperties;
}

export const ColumnContent = ({ 
  colTasks, 
  isOverlay = false, 
  dndAttributes, 
  dndListeners, 
  dndRef,
  style 
}: ColumnContentProps) => {
  // Logic เดิมของ UI ย้ายมาที่นี่
  const { updateColumn, status: statusBoard } = useBoardStore();
  const { status: statusTask } = useTaskStore();
  const [openTaskForm, setOpenTaskForm] = useState(false);

  const [onFocusBoardTools, setOnFocusBoardTools] = useState<{ hover: boolean; active: boolean; }>({ hover: false, active: false });
  const [editBoard, setEditBoard] = useState<{ value?: string; isEdit: boolean; }>({
    value: colTasks.name,
    isEdit: false,
  });
  const [insertDirection, setInsertDirection] = useState<'left' | 'right' | null>(null);

  const tasks = colTasks?.tasks ?? [];

  const isFetch = useMemo(() => {
    return statusBoard === 'fetching' || (statusTask === 'fetching');
  }, [statusBoard, statusTask]);

  const targetOpacity = 0.6;
  const backgroundStyle = colTasks.color ? { background: hexToRgba(colTasks.color, targetOpacity) } : {};

  const handleOpenTaskForm = () => setOpenTaskForm(!openTaskForm);

  const handleUpdateBoardValues = async () => {
    if (colTasks._id) {
      await updateColumn(colTasks._id, { name: editBoard.value ?? colTasks.name });
      setEditBoard((prev) => ({ ...prev, isEdit: false }));
    }
  };

  useEffect(() => {
    if (editBoard.isEdit) {
      setEditBoard((prev) => ({ ...prev, value: colTasks.name }));
    }
  }, [colTasks, editBoard.isEdit]);

  return (
    <div
      ref={dndRef} // ใช้ Ref ที่ส่งเข้ามา
      style={style}
      className={cn("flex gap-4", isOverlay && "rotate-2 cursor-grabbing")} // เพิ่ม Effect ตอน Drag นิดหน่อย
    >
      <BoardInsert currentOrder={colTasks.order} insertDirection={insertDirection} setInsertDirection={setInsertDirection}>
        <div
          className={cn('max-h-[450px] h-full min-h-[150px] max-w-[250px] min-w-[250px] z-2 bg-white',
            'flex flex-col flex-shrink-0 rounded-md border',
             isOverlay && "shadow-xl border-blue-500" // Highlight overlay
          )}
          data-board-column
        >
          {/* Header Section */}
          <div className={cn('flex h-12 items-center justify-between flex-shrink-0 p-3 border-b rounded-t-md', editBoard.isEdit && '!p-2')}
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
                  onClick={() => setEditBoard({ isEdit: true, value: colTasks.name })}
                  {...dndAttributes} // ใส่ DND Props
                  {...dndListeners}
                >
                  {colTasks.name}
                </div>
                {/* ... (ส่วน Badge และ Tools เหมือนเดิม) ... */}
                <div className="flex gap-2 items-center justify-end">
                  <Badge variant={'outline'} className="rounded-full text-xs bg-white text-gray-500 flex items-center text-start group-hover:hidden">
                    <div>{tasks.length}{colTasks.wipLimit > 0 && `/${colTasks.wipLimit}`}</div>
                    <div>task</div>
                  </Badge>
                  <BoardTools
                    column={colTasks}
                    onFocusBoardTools={onFocusBoardTools}
                    setOnFocusBoardTools={setOnFocusBoardTools}
                    setInsertDirection={setInsertDirection}
                  />
                </div>
              </div>
            ) : (
                // ... (Input Edit Mode เหมือนเดิม) ...
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

          {/* Body Section */}
          <div className='flex-1 overflow-y-auto scrollbar-thin-y space-y-2'>
            {isFetch ? (
              <div className="p-2 flex flex-col gap-2">
                <Skeleton className="h-[100px] w-full" />
                <Skeleton className="h-[100px] w-full" />
              </div>
            ) : (
              <div className="p-2 flex flex-col gap-2">
                 {/* สำคัญ: ถ้าเป็น Overlay เราอาจจะไม่ render TaskDnd หรือ render แบบ dummy 
                    เพื่อป้องกัน Task ข้างในเรียก useSortable ซ้อนอีก
                    แต่ถ้า dnd-kit version ใหม่ๆ อาจจะจัดการได้ 
                 */}
                {tasks.map((task) => (
                  <TaskDnd key={task._id} task={task} />
                ))}
                {openTaskForm && (
                  <PreviewTaskForm colId={colTasks._id} handleOpenTaskForm={handleOpenTaskForm} />
                )}
              </div>
            )}
          </div>
          
          {/* Footer Section */}
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
};


export const ColumnDnd = React.memo(({ colTasks }: BoardColumnProps) => {
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: colTasks._id,
    data: { type: "column", colTasks },
  });

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: colTasks._id,
    data: { type: "column", colTasks },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1, // จางลงเมื่อถูกลาก (ตัวที่อยู่ที่เดิม)
  };

  // รวม Ref (เพราะต้องใช้ทั้ง Sortable และ Droppable ที่ div เดียวกัน)
  const setRefs = (node: HTMLElement | null) => {
      setSortableRef(node);
      setDroppableRef(node);
  };

  return (
    <ColumnContent 
        colTasks={colTasks}
        dndAttributes={attributes}
        dndListeners={listeners}
        dndRef={setRefs}
        style={style}
    />
  );
});

