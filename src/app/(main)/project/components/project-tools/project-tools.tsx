"use client";

// components
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { ChartNoAxesGantt, Check, Mail, Plus, Search, UserPlus } from "lucide-react"
import { CreateProjectDropdown } from "./dropdown-content/create-project-dropdown"
import { useState } from "react"
import { GeneralDropdownContent } from "./dropdown-content/general-dropdown"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InviteMembers } from "./invite-member"
import { AssigneesAvatar } from "../kanban/ui-customize/assignees-avatar"
import { PreviewMembers } from "../kanban/task-tab-tools/preview-members"
import { useProjectStore } from "@/store";

export const ProjectToolsMenu = () => {
    const { projectIsUsing, projects, status } = useProjectStore();
    const currentProject = projectIsUsing? projects[projectIsUsing ?? ''] : null;

    return (
        <div className="flex items-center justify-between w-full pr-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild disabled={status === 'fetching'}>
                    <div className="flex items-center gap-2 p-2 rounded-md cursor-pointer bg-white shadow-sm hover:bg-blue-500 text-gray-700 hover:text-white duration-300 transition-all">
                        {status === 'fetching' ? (
                            <Skeleton className="h-[30px] w-[120px] mr-4" />
                        ) : (

                            <p className="text-md font-bold">{currentProject?.name}</p>
                        )}
                        <Avatar className="rounded-md w-fit h-full">
                            <AvatarImage src={currentProject?.coverImage ?? undefined} alt={currentProject?.name ?? "Project"} />
                            <AvatarFallback className="p-1 w-fit h-fit rounded-md bg-blue-100">
                                <ChartNoAxesGantt className="w-4 h-4 text-blue-500" />
                            </AvatarFallback>
                        </Avatar>
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80 max-h-90 h-fit overflow-y-auto scrollbar-thin-y" side="bottom" align="start">
                    <GeneralDropdownContent currentProject={currentProject} />
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
                    {/* <PreviewMembers assinees={(projectIsActive?.members.map((m) => m.userId) ?? [])} /> */}
                    {/* <AssigneesAvatar userIds={(projectIsActive?.members.map((m) => m.userId) ?? [])} /> */}
                </div>
                {/* <InviteMembers /> */}
            </div>
        </div>
    )
}
