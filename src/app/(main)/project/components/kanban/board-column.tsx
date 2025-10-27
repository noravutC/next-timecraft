import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Column, ColumnCache } from "@/types";
import React, { useEffect, useMemo, useState } from "react";
import { TaskCard } from "./task-card";
import { Skeleton } from "@/components/ui/skeleton";
// import { cn } from "@/lib/utils";
// import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { PreviewTaskForm } from "./ui-customize/preview-task-form";
import { useBoardStore, useTaskStore } from "@/hooks";

interface BoardColumnProps {
  column: ColumnCache;
}

export const BoardColumn = React.memo(({ column: initialColumn }: BoardColumnProps) => {
  const { status: statusBoard } = useBoardStore();
  const { tasks: stateTasks, status: statusTask } = useTaskStore();
  const column = useBoardStore(state => state.columns[initialColumn._id] || initialColumn);
  const [openTaskForm, setOpenTaskForm] = useState(false);
  if (!column) return null;
  const tasks = (Object.values(stateTasks) || []).filter((t) => t.columnId === column._id);

  const isFetch = useMemo(() => {
    return statusBoard === 'fetching' || (statusTask === 'fetching');
  }, [statusBoard, statusTask]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    const scrollThreshold = 100; // Load more when 100px from the bottom
  
    // if (
    //   scrollTop + clientHeight >= scrollHeight - scrollThreshold &&
    //   column.hasMoreTasks &&
    //   !column.isLoadingTasks
    // ) {
    //   // 💡 เรียกฟังก์ชันโหลดเพิ่มเติม
    //   // fetchMoreTasks(column._id, column.taskPage + 1);
    // }
  };

  const handleOpenTaskForm = () => {
    setOpenTaskForm(!openTaskForm);
  }

  // if (isLoadingInitial && column.totalTasks === 0) {
  //   // อาจจะต้องปรับ logic การ Loading เพื่อให้เข้ากับสถานะใหม่ของ useBoardStore
  //   // ถ้า taskPage เป็น 0 (แต่จริงๆ ควรจะเป็น 1 ถ้า fetchBoardData สำเร็จ) 
  //   // สำหรับตอนนี้ ให้ใช้ status จาก KanbanBoard เป็นตัวควบคุมการโหลดเริ่มต้น
  // }

  // 💡 การแสดงผล tasks และ loading state
  const renderTasks = () => {
    const taskElements = tasks.map((task) => (
      <TaskCard key={task._id} task={task} />
    ));

    // แสดง Tasks ที่มีอยู่
    const content = (
      <div className="p-2 flex flex-col gap-2">
        {taskElements}
        {openTaskForm && (
          <PreviewTaskForm
            colId={column._id}
            handleOpenTaskForm={handleOpenTaskForm}
          />
        )}
      </div>
    );

    // แสดง Loading Skeleton สำหรับการโหลดเพิ่มเติม
    // const loadingMore = column.isLoadingTasks && column.taskPage > 0 && (
    //   <div className="p-2 flex flex-col gap-2">
    //     <Skeleton className="h-[80px] w-full" />
    //     <Skeleton className="h-[80px] w-full" />
    //   </div>
    // );

    // รวมเนื้อหา
    return (
      <>
        {content}
        {/* {loadingMore} */}
        {/* {!column.hasMoreTasks && column.totalTasks > 0 && (
          <div className="p-2 text-center text-xs text-gray-500">
            End of tasks ({column.totalTasks} total)
          </div>
        )} */}
      </>
    )
  }

  return (
    <div
      className='max-h-[450px] h-full min-h-[150px] max-w-[250px] min-w-[250px] flex flex-col flex-shrink-0 rounded-md border'
      data-board-column
    >
      <div className='flex justify-between flex-shrink-0 p-3 border-b'>
        <p className="font-semibold text-sm">{column.name}</p>

        <div className="flex gap-2 items-center">
          <div className="rounded-full w-3 h-3"
            style={{
              background: column.color ?? ``,
            }}
          />
          {/* Badge แสดง Total Tasks ที่ถูกต้อง */}
          <Badge variant={'outline'} className="rounded-full text-xs bg-white text-gray-500 flex items-center text-start">
            <div>{tasks.length}{column.wipLimit > 0 && `/${column.wipLimit}`}</div>
            {/* Unit */}
            <div>task</div>
          </Badge>
        </div>
      </div>
      <div
        className='flex-1 overflow-y-auto scrollbar-thin-y space-y-2'
        onScroll={handleScroll}
      >
        {
        // (column.taskPage === 0 || column.isLoadingTasks) && 
        isFetch ? (
          <div className="p-2 flex flex-col gap-2">
            <Skeleton className="h-[100px] w-full" />
            <Skeleton className="h-[100px] w-full" />
            <Skeleton className="h-[100px] w-full" />
          </div>
        ) : (
          renderTasks()
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
  )
});