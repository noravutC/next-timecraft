'use client';

import React from "react";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ColumnCache } from "@/types/column";
import { useTaskStore } from "@/hooks";
import { TaskCard } from "../task-card";
import { MoveRight, PackageMinus } from "lucide-react";
import { hexToRgba } from "@/helper/utils";
import { ColumnSelector } from "../../selector/column-selector";
import { Badge } from "@/components/ui/badge";

interface MoveTaskToColumnProps extends React.ComponentPropsWithRef<typeof Dialog> {
    // task: Task;
    column: ColumnCache;
}

export const MoveTaskToColumn = ({
    column,
    ...props
}: MoveTaskToColumnProps) => {
    // const { tasks: stateTasks, status: statusTask } = useTaskStore();
    // const tasks = (Object.values(stateTasks) || []).filter((t) => t.columnId === column._id);
    // const renderTasks = () => {
    //     const taskElements = tasks.map((task) => (
    //         <TaskCard key={task._id} task={task} />
    //     ));
    //     const content = (
    //         <div className="p-2 flex flex-col gap-2">
    //             {taskElements}
    //         </div>
    //     );
    //     return (
    //         <>
    //             {content}
    //         </>
    //     )
    // }
    const targetOpacity = 0.6;
    const backgroundStyle = column.color
        ? { background: hexToRgba(column.color, targetOpacity) }
        : {};
    return (
        <Dialog {...props}>
            <DialogContent
                className="[&>button]:hidden top-1/5 -translate-y-1/5 sm:max-w-[550px] max-h-55 h-full rounded p-0 overflow-hidden"
                onOpenAutoFocus={(e) => e.preventDefault()}
                onCloseAutoFocus={(e) => e.preventDefault()}
            >
                <DialogHeader hidden>
                    <DialogTitle>
                    </DialogTitle>
                </DialogHeader>
                <div className="p-4">
                    <div className="flex items-center h-fit w-full gap-4 mb-4">
                        <PackageMinus className="size-6 text-red-500" />
                        <p className="text-xl font-bold">Confirm Deletion and Task Migration</p>
                    </div>
                    <p className="flex flex-wrap text-sm text-gray-700">
                        Please select a destination column to move these tasks before proceeding with column deletion.
                    </p>
                </div>
                <div className="flex items-center justify-between p-4">
                    <div className="border-red-500  border bg-white p-2 rounded-md shadow-md">
                        <div className="flex items-center min-w-50 h-fit">
                            <Badge style={backgroundStyle} className="text-gray-800">{column.name}</Badge>
                        </div>
                    </div>
                    <MoveRight className="text-gray-500 size-5" />

                    <div className="border border-blue-500 p-1 rounded-md shadow-md">
                        <ColumnSelector column={column} />
                    </div>
                </div>

                {/* <div className="flex"></div> */}
                {/* {renderTasks()} */}
            </DialogContent>
        </Dialog>
    )
};