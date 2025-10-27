import { AvatarTimeCraft } from "@/components/ui/avatar-timecraft"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useTaskStore, useUserStore } from "@/hooks"
import { ListCheck, UserRoundPlus } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCallback, useState } from "react"

interface MembersTabProps {
    taskId: string;
    assignees: string[];
}
export const MembersTab = ({
    taskId,
    assignees,
}: MembersTabProps) => {
    const { users, status } = useUserStore();
    const { updateTask } = useTaskStore();
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

        // **(Optional):** ถ้า DropdownMenu ปิดเองไม่ได้ ให้คุณจัดการ State การเปิด/ปิด Popover ที่นี่
    };
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant={'outline'}
                    className="cursor-pointer text-gray-600"
                >
                    <UserRoundPlus />
                    Members
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="start" className="min-w-[250px] p-0">
                <div className="min-h-[200px] h-fit px-2 pb-2">
                    <p className="w-full text-center pt-2 text-sm font-semibold text-gray-600">Member</p>
                    <div className="py-4">
                        <Input placeholder="Search member..." />
                    </div>
                    <div className="flex flex-col text-sm text-gray-600 overflow-y-auto scrollbar-thin-y max-h-[200px]">
                        {(assigneesInProject?.length > 0) ? (
                            <>
                                {(assigneesInProject ?? []).map((u) => (
                                    <DropdownMenuItem
                                        key={u._id}
                                        className="cursor-pointer"
                                        onSelect={(e) => {
                                            e.preventDefault();
                                            handleToggleAssignee(u._id);
                                        }}
                                    >
                                        <AvatarTimeCraft src={u.avatar} name={u.fullName} email={u.email} />
                                    </DropdownMenuItem>
                                ))}

                            </>
                        ) : status === 'fetching' ? (
                            <>
                                <div className="mb-2">
                                    <AvatarTimeCraft name={""} loader={true} />
                                </div>
                                <div className="mb-2">
                                    <AvatarTimeCraft name={""} loader={true} />
                                </div>
                                <div className="mb-2">
                                    <AvatarTimeCraft name={""} loader={true} />
                                </div>
                            </>
                        ) : (
                            <div className="h-[80px] flex items-center justify-center">
                                No members.
                            </div>
                        )}

                    </div>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}