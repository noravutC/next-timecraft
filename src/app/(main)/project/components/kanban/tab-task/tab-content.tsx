import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ListCheck, UserRoundPlus } from "lucide-react"
import React from "react"
import { MembersSelector } from "./members-selector"

interface TabContentProps {
    taskId: string;
    assignees: string[];
}
export const TabContent = ({
    taskId,
    assignees,
}: TabContentProps) => {
    return (
        <div className="flex items-center gap-4 my-4">
            <div className="relative">
                <Button
                    variant={'outline'}
                    className="cursor-pointer text-gray-600"
                >
                    <ListCheck />
                    Checklist
                </Button>
            </div>
            <div className="relative">
                <MembersSelector taskId={taskId} assignees={assignees} />
            </div>
        </div>
    )
}