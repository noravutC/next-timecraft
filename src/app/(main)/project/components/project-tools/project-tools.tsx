// components
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { ChartNoAxesGantt, Check, Mail, Plus, Search, UserPlus } from "lucide-react"
import { useProjectStore } from "@/hooks"
import { CreateProjectDropdown } from "./dropdown-content/create-project-dropdown"
import { useState } from "react"
import { GeneralDropdownContent } from "./dropdown-content/general-dropdown"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InviteMembers } from "./invite-member"
import { AssigneesAvatar } from "../kanban/ui-customize/assignees-avatar"
import { PreviewMembers } from "../kanban/task-tab-tools/preview-members"

export const ProjectToolsMenu = () => {
    const {
        status,
        projectIdActivate,
        getProjectById,
        // setActivateProject,
    } = useProjectStore();
    // const [menuOption, setMenuOption] = useState<{
    //     newProject: boolean;
    //     settings: boolean;
    // }>({
    //     newProject: false,
    //     settings: false,
    // });
    // const { menuValue, setMenuValue } = useProjectAtMenu();
    const projectIsActive = getProjectById(projectIdActivate ?? '');

    // const isHidden = !(menuOption.newProject || menuOption.settings);
    return (
        <div className="flex items-center justify-between w-full pr-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild disabled={status === 'fetching'}>
                    <div className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-gray-100 ">
                        {status === 'fetching' ? (
                            <Skeleton className="h-[30px] w-[120px] mr-4" />
                        ) : (

                            <p className="text-md text-gray-700 font-bold">{projectIsActive?.name}</p>
                        )}
                        <Avatar className="rounded-md w-fit h-full">
                            <AvatarImage src={''} alt="@shadcn" />
                            <AvatarFallback className="p-1 w-fit h-fit rounded-md bg-blue-100">
                                <ChartNoAxesGantt className="w-4 h-4 text-blue-500" />
                            </AvatarFallback>
                        </Avatar>
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80 max-h-90 h-fit overflow-y-auto scrollbar-thin-y" side="bottom" align="start">
                    <GeneralDropdownContent />
                    {/* {isHidden && (
                    )} */}
                    {/* {menuOption.newProject && (
                        <CreateProjectDropdown setMenuOption={setMenuOption} />
                    )} */}
                </DropdownMenuContent>
                {/* {isHidden && (
                    <GeneralDropdownContent setMenuOption={setMenuOption} />
                )}
                {menuOption.newProject && (
                    <CreateProjectDropdown setMenuOption={setMenuOption} />
                )} */}
            </DropdownMenu>
            <div className="flex items-center justify-end">
                <div className="mr-4 flex items-center gap-2 bg-gray-200 p-2 rounded-md">
                    <PreviewMembers assinees={(projectIsActive?.members.map((m) => m.userId) ?? [])} />
                    {/* <AssigneesAvatar userIds={(projectIsActive?.members.map((m) => m.userId) ?? [])} /> */}
                </div>
                <InviteMembers />
            </div>
        </div>
    )
}