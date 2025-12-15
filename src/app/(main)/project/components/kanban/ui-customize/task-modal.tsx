'use client';

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Task } from "@/types";
import { useBoardStore, useUserStore } from "@/hooks";
import { TabContent } from "../task-tab-tools/tab-content";
import { PreviewMembers } from "../task-tab-tools/preview-members";
import { CheckListBuilder } from "./modal-group/checklist-builder";

interface TaskModalProps extends React.ComponentPropsWithRef<typeof Dialog> {
    task: Task;
}

export const TaskModal = ({
    task,
    ...props
}: TaskModalProps) => {
    const { getColumnById } = useBoardStore();
    // const [tabValue, setTabValue] = useState<'checklist' | null>(null);
    // const { currentUser } = useCurrentUserContext();
    const columnValue = getColumnById(task.columnId);
    return (
        <Dialog {...props}>
            <DialogContent
                className="[&>button]:hidden sm:max-w-[425px] md:max-w-[600px] 
                lg:max-w-[900px] xl:max-w-[1100px] max-h-[550px] h-full rounded p-0 overflow-hidden"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <DialogHeader hidden>
                    <DialogTitle>
                    </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col w-full h-full overflow-hidden pt-2">
                    <div
                        className="px-4 grid grid-cols-3 border-b border-gray-300 pb-4"
                    // header area
                    >
                        <div className="col-span-2 flex-wrap pt-2">
                            <div className="p-2 bg-gray-100 flex gap-2 items-center w-fit rounded-md">
                                <div className="w-3 h-3 rounded-full"
                                    style={{
                                        background: columnValue?.color,
                                    }}
                                />
                                <p className="text-sm font-semibold text-gray-700"
                                >
                                    {columnValue?.name}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center justify-end">

                        </div>
                    </div>
                    <div
                        className="px-4 flex-1 overflow-hidden flex"
                    // content area
                    >
                        <div
                            className="px-1 flex-1 overflow-y-auto scrollbar-thin-y overflow-x-hidden border-r border-gray-300 flex flex-col pt-4"
                        >
                            <p className="text-gray-700 font-bold text-xl">{task.title}</p>
                            <TabContent taskId={task._id} assignees={task.assignees} />
                            {task.assignees.length > 0 && (
                                <div className="mt-6 flex flex-col">
                                    <p className="mb-2 text-xs font-semibold text-gray-700">Assignee</p>
                                    <PreviewMembers assinees={task.assignees} size="size-8" />
                                </div>
                            )}
                            <CheckListBuilder />
                        </div>
                        <div className="min-w-[400px] overflow-y-auto scrollbar-thin-y overflow-x-hidden ">

                            {/* <div className="h-[2000px]"></div> */}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}