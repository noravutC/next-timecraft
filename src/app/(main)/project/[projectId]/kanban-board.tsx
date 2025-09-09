import { useEffect, useMemo } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { BoardColumn } from "./board-column";
import { Project } from "@/types";
import { useColumnStore } from "@/hooks/useColumns.hook";
import { Skeleton } from "@/components/ui/skeleton";

interface KanbanBoardProps {
  project: Project;
}
export function KanbanBoard({
  project,
}: KanbanBoardProps) {
  const { fetchColumnsByProjectId, getColumnsByProjectId, status } = useColumnStore();
  if (!project) {
    return <div className="w-full h-full flex justify-start items-center">Project not found</div>;
  }

  const columns = useMemo(() => {
    if (status === "none") {
        return getColumnsByProjectId(project?._id);
    }
    return [];
  }, [status, project, getColumnsByProjectId]);

  useEffect(() => {
    fetchColumnsByProjectId(project._id);
  }, [project]);

  return (
    <div className="w-full h-full flex items-end gap-4">
      <ScrollArea className="w-full max-h-[75vh] h-full whitespace-nowrap overflow-hidden pb-2">
        <div className="flex w-full h-full items-end gap-4 pr-4">
          {/* Column Space */}
          {status === "fetching" ? (
            <>
              <Skeleton className="rounded-md h-[70vh] min-w-[300px] max-w-[20vw] w-full border" />
              <Skeleton className="rounded-md h-[70vh] min-w-[300px] max-w-[20vw] w-full border" />
              <Skeleton className="rounded-md h-[70vh] min-w-[300px] max-w-[20vw] w-full border" />
            </>
          ) : (
            <>
              {columns.map((col) => (
                <BoardColumn key={col._id} column={col} />
              ))}
            </>
          )}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

    </div>
  );
}