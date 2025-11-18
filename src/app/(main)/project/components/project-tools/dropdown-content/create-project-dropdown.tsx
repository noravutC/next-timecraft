import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    // DropdownMenuSeparator,
    DropdownMenuLabel,
    // DropdownMenuGroup,
    // DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
// import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LoaderCircle, PlusSquareIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useProjectStore } from "@/hooks"
import { Project } from "@/types"
import { Dispatch, SetStateAction, useState } from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useCurrentUserContext } from "@/context/current-user-context"

interface CreateProjectDropdownProps {
    setSubmenuOpen: Dispatch<SetStateAction<"new-project" | "settings" | null>>
}
export const CreateProjectDropdown = ({
    setSubmenuOpen,
}: CreateProjectDropdownProps) => {
    const { currentUser } = useCurrentUserContext();
    const { createProject, status } = useProjectStore();

    const [newProject, setNewProject] = useState<Partial<Project>>({
        name: '',
        archived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    });
    const handleCreateProject = () => {
        if (!newProject || !newProject.name || newProject.name === '' || !currentUser) {
            return;
        }
        createProject({
            ...newProject,
            ownerId: currentUser.userId,
            // name: newProject.name,
        });
        setSubmenuOpen(null);
    }

    const projectIsValid = newProject.name === '' || !newProject.name;
    return (
        <>
            {/* <div className="min-w-80 p-2 mb-4 flex flex-col gap-4"> */}
            <div className="w-full p-4 flex flex-col gap-4">
                <p className="font-semibold text-gray-700 text-center">Create project</p>
                <div className="flex flex-col gap-2">
                    <div className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                        Project
                        {projectIsValid &&
                            (<p className="text-red-500">*</p>)
                        }
                    </div>
                    <Input
                        autoFocus
                        // placeholder="E.g., Website Redesign"
                        className="text-xs"
                        value={newProject.name}
                        onChange={(e) =>
                            setNewProject(prev => ({ ...prev, name: e.target.value }))
                        }
                    />
                </div>
                <Button
                    className={cn("cursor-pointer select-none bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center",
                        (!newProject?.name || newProject.name.trim() === '') && 'bg-gray-200/80 text-gray-600'
                    )}
                    size={'sm'}
                    disabled={!newProject?.name || newProject.name.trim() === '' || status === 'creating'}
                    onClick={handleCreateProject}
                >
                    {status === 'creating' && (
                        <LoaderCircle className="mr-2 animate-spin text-blue-300" strokeWidth={3} />
                    )}
                    Create project
                </Button>
            </div>
        </>
    )
}