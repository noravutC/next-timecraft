
import { useBoardStore, useProjectStore, useUserStore } from '@/hooks';
import { CircleAlert } from 'lucide-react';
import React, { useEffect, useMemo } from 'react';
import { BoardColumn } from './board-column';
import { LoaderPage } from '@/components/Loader-page';
import { CreateColumn } from './ui-customize/create-column';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface KanbanBoardProps {
    projectId: string | null | undefined;
}

export const KanbanBoard = ({
    projectId,
}: KanbanBoardProps) => {
    const {
        fetchBoardByProjectId,
        clearColumns,
        columns,
        status
    } = useBoardStore();
    const { getProjectById, projects } = useProjectStore();
    const { fetchUsersByIds } = useUserStore();
    const columnInProject = Object.values(columns).sort((a, b) => a.order - b.order);

    const lastOrderColumn = useMemo(() => {
        return columnInProject.reduce((max, col) => col.order > max ? col.order : max, 0);
    }, [columnInProject]);

    useEffect(() => {
        if (projectId) {
            // clearColumns();
            fetchBoardByProjectId(projectId);

            const projectNow = getProjectById(projectId);
            if ((projectNow?.members ?? []).length > 0) {
                const userIds: string[] = (projectNow?.members ?? []).map((m) => m.userId).filter((item) => item !== undefined);
                fetchUsersByIds(userIds);
            }
        }
    }, [projectId, clearColumns, projects]);


    return (
        <>
            {status === "fetching" ? (
                <div className='h-full w-full pt-2 flex justify-center items-center'>
                    <LoaderPage ballSize={3} />
                </div>) : (
                <div className='max-w-full h-full overflow-y-hidden scrollbar-thin-x overflow-x-auto'>
                    <div className='w-full flex gap-4 h-full p-4'>
                        {columnInProject.map((col) => (
                            <BoardColumn
                                key={col._id}
                                column={col}
                            />
                        ))}
                        {/* <div className='max-h-[450px] h-full min-h-[150px] max-w-[250px] min-w-[250px] flex flex-col flex-shrink-0 rounded-md border'>
                            <div className='flex-shrink-0 p-3 font-bold text-black border-b'>
                                Header
                            </div>

                            <div className='flex-1 overflow-y-auto p-2 space-y-2'>
Content
                            </div>

                            <div className='flex-shrink-0 p-2 border-t text-sm'>
                                Footer
                            </div>
                        </div> */}
                        {/* <CreateColumn projectId={projectId} lastOrderColumn={lastOrderColumn} /> */}
                    </div>

                </div>
            )}

            {/* <div className='w-full max-h-[70vh] h-[70vh] flex items-start justify-center'>
                        {!projectId ? (
                            <div className='h-[65vh] w-full flex justify-center items-center gap-2'>
                                <CircleAlert className='text-gray-600 size-5' />
                                <span className='font-semibold text-sm text-gray-600'>Not selected project</span>
                            </div>
                        ) : (
                            <div className="flex min-w-full h-[60vh] items-end gap-8 p-4 pb-6">
                                {columnInProject.map((col) => (
                                    <BoardColumn
                                        key={col._id}
                                        column={col}
                                    />
                                ))}

                            </div>
                        )}
                    </div> */}
        </>
    )
}

// function CustomHorizontalScroll({ children }: { children: React.ReactNode }) {
//   const containerRef = useRef<HTMLDivElement>(null);
//   const scrollbarRef = useRef<HTMLDivElement>(null);
//   const thumbRef = useRef<HTMLDivElement>(null);
//   const isDraggingRef = useRef(false);
//   const dragStartXRef = useRef(0);
//   const scrollStartXRef = useRef(0);

//   // update thumb size & position
//   const updateThumb = () => {
//     const container = containerRef.current;
//     const scrollbar = scrollbarRef.current;
//     const thumb = thumbRef.current;
//     if (!container || !scrollbar || !thumb) return;

//     const scrollWidth = container.scrollWidth;
//     const clientWidth = container.clientWidth;
//     const scrollLeft = container.scrollLeft;

//     const thumbW = (clientWidth / scrollWidth) * scrollbar.clientWidth;
//     const thumbL = (scrollLeft / scrollWidth) * scrollbar.clientWidth;

//     thumb.style.width = `${thumbW}px`;
//     thumb.style.left = `${thumbL}px`;
//   };

//   // sync thumb with scroll
//   useEffect(() => {
//     const container = containerRef.current;
//     if (!container) return;

//     updateThumb();

//     container.addEventListener("scroll", updateThumb);
//     window.addEventListener("resize", updateThumb);

//     return () => {
//       container.removeEventListener("scroll", updateThumb);
//       window.removeEventListener("resize", updateThumb);
//     };
//   }, []);

//   // handle drag
//   const handleMouseDown = (e: React.MouseEvent) => {
//     isDraggingRef.current = true;
//     dragStartXRef.current = e.clientX;
//     const thumb = thumbRef.current;
//     scrollStartXRef.current = thumb ? parseFloat(thumb.style.left || "0") : 0;
//   };

//   useEffect(() => {
//     const handleMouseMove = (e: MouseEvent) => {
//       if (!isDraggingRef.current) return;
//       const container = containerRef.current;
//       const scrollbar = scrollbarRef.current;
//       const thumb = thumbRef.current;
//       if (!container || !scrollbar || !thumb) return;

//       const deltaX = e.clientX - dragStartXRef.current;
//       const newLeft = Math.min(
//         Math.max(scrollStartXRef.current + deltaX, 0),
//         scrollbar.clientWidth - thumb.offsetWidth
//       );
//       thumb.style.left = `${newLeft}px`;

//       // scroll container immediately
//       const scrollPercent = newLeft / (scrollbar.clientWidth - thumb.offsetWidth);
//       container.scrollLeft = scrollPercent * (container.scrollWidth - container.clientWidth);
//     };

//     const handleMouseUp = () => {
//       isDraggingRef.current = false;
//     };

//     window.addEventListener("mousemove", handleMouseMove);
//     window.addEventListener("mouseup", handleMouseUp);

//     return () => {
//       window.removeEventListener("mousemove", handleMouseMove);
//       window.removeEventListener("mouseup", handleMouseUp);
//     };
//   }, []);

//   return (
//     <div className="w-full max-w-[700px] mx-auto bg-gray-100 rounded-2xl p-3">
//       {/* scroll area */}
//       <div
//         ref={containerRef}
//         className="flex overflow-x-auto gap-3 no-scrollbar"
//       >
//         {children}
//         {/* {Array.from({ length: 10 }).map((_, i) => (
//           <div
//             key={i}
//             className="min-w-[120px] h-[80px] bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-600 font-medium"
//           >
//             Card {i + 1}
//           </div>
//         ))} */}
//       </div>

//       {/* custom scrollbar */}
//       <div ref={scrollbarRef} className="relative h-10 mt-3 bg-gray-500 rounded-sm">
//         <div
//           ref={thumbRef}
//           onMouseDown={handleMouseDown}
//           className="absolute top-0 h-10 border-3 border-blue-500 rounded-sm cursor-pointer active:border-blue-600"
//         />
//       </div>
//     </div>
//   );
// }
