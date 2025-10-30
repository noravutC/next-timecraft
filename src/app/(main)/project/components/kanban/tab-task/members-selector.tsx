import { AvatarTimeCraft } from "@/components/ui/avatar-timecraft"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover" // <- Used here
import { useTaskStore, useUserStore } from "@/hooks"
import { ListCheck, UserRoundPlus } from "lucide-react"
import { useCallback, useState } from "react"
import { cn } from "@/lib/utils"
import React from "react"

interface MembersSelectorProps {
    taskId: string;
    assignees: string[];
}

export const MembersSelector = React.memo(({
    taskId,
    assignees,
}: MembersSelectorProps) => {
    const { users, status } = useUserStore();
    const { updateTask } = useTaskStore();
    // Use 'open' state for Popover control
    const [open, setOpen] = useState<boolean>(false);
    const [currentAssignees, setCurrentAssignees] = useState<string[]>(assignees);
    const assigneesInProject = Object.values(users);

    const handleToggleAssignee = (userId: string) => {
        const isAssigned = currentAssignees.includes(userId);

        let newAssignees: string[];
        if (isAssigned) {
            newAssignees = currentAssignees.filter((id) => id !== userId);
        } else {
            newAssignees = [...currentAssignees, userId];
        }

        setCurrentAssignees(newAssignees);

        updateTask(taskId, {
            assignees: newAssignees,
        });
    };

    // RENDER WITH POPOVER
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={'outline'}
                    className="cursor-pointer text-gray-600"
                >
                    <UserRoundPlus />
                    Members
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="p-0 min-w-[250px] max-w-[300px]"
                align="start"
            >
                <div className="min-h-[250px] h-fit px-2 pb-2">
                    <p className="w-full text-center pt-2 text-sm font-semibold text-gray-600">Members</p>
                    <div className="pt-4 pb-2">
                        <Input
                            placeholder="Search member..."
                        // Note: For searching, you might want to use <Command> and <CommandInput>
                        // instead of <Input> as they are designed for filtering lists.
                        />
                    </div>
                    <div className="flex flex-col text-sm text-gray-600 overflow-y-auto scrollbar-thin-y max-h-[300px]">
                        {(assigneesInProject?.length > 0) ? (
                            <>
                                {(assigneesInProject ?? []).map((u) => {
                                    const isChecked = currentAssignees.includes(u._id);
                                    return (
                                        <div
                                            key={u._id}
                                            className={cn("cursor-pointer hover:bg-gray-100 p-2 flex items-center justify-between",
                                                isChecked && 'bg-gray-100'
                                            )}
                                            onClick={() => handleToggleAssignee(u._id)}
                                        >
                                            <AvatarTimeCraft src={u.avatar} name={u.fullName} email={u.email} />
                                            {isChecked && <ListCheck className="h-4 w-4 text-green-500" />}
                                        </div>
                                    )
                                })}

                            </>
                        ) : status === 'fetching' ? (
                            <>
                                {/* Loading Skeletons */}
                                <div className="mb-2"><AvatarTimeCraft name={""} loader={true} /></div>
                                <div className="mb-2"><AvatarTimeCraft name={""} loader={true} /></div>
                                <div className="mb-2"><AvatarTimeCraft name={""} loader={true} /></div>
                            </>
                        ) : (
                            <div className="h-[80px] flex items-center justify-center">
                                No members.
                            </div>
                        )}

                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
})