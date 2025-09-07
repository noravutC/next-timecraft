import React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area";

interface TaskModalProps {
    taskId: string;
    taskTitle: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const TaskModal = ({
    taskId,
    taskTitle,
    open,
    onOpenChange,
}: TaskModalProps) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="flex flex-col sm:max-w-[425px] md:max-w-[600px] lg:max-w-[900px] xl:max-w-[1200px] max-w-[90vw]
                max-h-[600px] h-full"
            >
                <DialogTitle></DialogTitle>
                <ScrollArea className="p-4 bg-red-100 h-full">
                    <div className="h-[5000px]"></div>
                </ScrollArea>
                {/* <div className="p-4 bg-red-100 h-full">
                    <h2 className="text-lg font-semibold">{taskTitle}</h2>
                    <p>Task ID: {taskId}</p>
                </div> */}
            </DialogContent>
        </Dialog>
    )
}