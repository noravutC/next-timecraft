"use client";
// components
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenuContent,
    DropdownMenuSeparator,
    DropdownMenuLabel,
    DropdownMenuGroup,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Bolt, PlusSquareIcon } from "lucide-react"
import { ProjectSelector } from "../../selector/project-selector"
import { useProjectStore } from "@/hooks"
import { Dispatch, SetStateAction, useState } from "react"
import { CreateProjectDropdown } from "./create-project-dropdown"

interface GeneralDropdownContentProps {
    // setMenuOption: Dispatch<SetStateAction<{
    //     newProject: boolean;
    //     settings: boolean;
    // }>>
}

export const GeneralDropdownContent = ({
    // setMenuOption,
}: GeneralDropdownContentProps) => {
    const [submenuOpen, setSubmenuOpen] = useState<'new-project' | 'settings' | null>(null);
    const {
        projects,
        projectIdActivate,
        setActivateProject,
    } = useProjectStore();
    const currentProjects = Object.values(projects);
    switch (submenuOpen) {
        case 'new-project':
            return (
                <CreateProjectDropdown
                    setSubmenuOpen={setSubmenuOpen}
                />
            )
        // case 'settings':
        //     return (
        //         <SettingsProjectDropdown
        //             setMenuOption={setMenuOption}
        //         />
        //     )
        // case null:
            
        default:
            return (
                <>
                    <DropdownMenuLabel className="text-xs font-normal text-gray-500">Switch your project</DropdownMenuLabel>
                    <DropdownMenuGroup className="p-1">
                        <ProjectSelector
                            options={currentProjects}
                            optionKeys={{
                                value: '_id',
                                label: 'name',
                                description: 'description',
                            }}
                            value={projectIdActivate ?? null}
                            onChange={setActivateProject}
                            placeholder={"Select project"}
                            placeholderKeyword={"project"}
                        />
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs font-normal text-gray-500">Manage your project</DropdownMenuLabel>
                    <DropdownMenuGroup>
                        <DropdownMenuItem
                            className="cursor-pointer"
                            onSelect={(event) => {
                                event.preventDefault();
                                setSubmenuOpen('new-project');
                            }}
                        >
                            <Avatar className="rounded-md w-fit h-full">
                                <AvatarImage src={''} alt="@shadcn" />
                                <AvatarFallback className="p-1 w-fit h-fit rounded-md bg-blue-100">
                                    <PlusSquareIcon className="w-4 h-4 text-blue-500" />
                                </AvatarFallback>
                            </Avatar>
                            <p>New project</p>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="cursor-pointer"
                            onSelect={(event) => {
                                event.preventDefault();
                                setSubmenuOpen('new-project');
                            }}
                        >
                            <Avatar className="rounded-md w-fit h-full">
                                <AvatarImage src={''} alt="@shadcn" />
                                <AvatarFallback className="p-1 w-fit h-fit rounded-md bg-blue-100">
                                    <Bolt className="w-4 h-4 text-blue-500" />
                                </AvatarFallback>
                            </Avatar>
                            <p>Settings Project</p>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                </>
            );
    }
    // return (
    //     <>
    //         {submenuOpen === 'new-project' && ()}

    //     </>
    // )
}