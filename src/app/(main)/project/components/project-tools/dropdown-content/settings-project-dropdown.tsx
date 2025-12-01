"use client";

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LoaderCircle, PlusSquareIcon, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useProjectStore } from "@/hooks"
import { Project, ProjectCache } from "@/types"
import { Dispatch, SetStateAction, useEffect, useState } from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface SettingsProjectDropDownProps {
    activeProject?: ProjectCache | undefined;
    setSubmenuOpen: Dispatch<SetStateAction<"new-project" | "settings" | null>>
}
export const SettingsProjectDropDown = ({
    activeProject,
    setSubmenuOpen,
}: SettingsProjectDropDownProps) => {
    const { updateProject, status } = useProjectStore();
    const [initailProject, setInitialProject] = useState<ProjectCache | undefined>(activeProject);
    const [tagInput, setTagInput] = useState("");


    const handleAddTag = () => {
        if (!tagInput.trim()) return;
        setInitialProject((prev) => ({
            ...(prev ?? {}),
            tags: [...(prev?.tags ?? []), tagInput.trim()],
        } as ProjectCache));
        setTagInput("");
    };


    const handleRemoveTag = (tag: string) => {
        setInitialProject((prev) => ({
            ...(prev ?? {}),
            tags: prev?.tags?.filter((t) => t !== tag) ?? [],
        } as ProjectCache));
    };

    const handleUpdateProject = async () => {
        if (!initailProject || !initailProject.name || initailProject.name === '' || !activeProject?._id) {
            return;
        }
        await updateProject(activeProject._id, initailProject);
        setSubmenuOpen(null);
    }

    const projectIsValid = initailProject?.name === '' || !initailProject?.name;

    useEffect(() => {
        if (activeProject) {
            setInitialProject(activeProject);
        }
    }, [activeProject]);

    if (!activeProject) {
        return (
            <div className="w-full p-4 flex flex-col gap-4">
                <p className="font-semibold text-gray-700 text-center">No active project selected</p>
            </div>
        );
    }

    return (
        <>
            {/* <div className="min-w-80 p-2 mb-4 flex flex-col gap-4"> */}
            <div className="w-full p-4 flex flex-col gap-4">
                <p className="font-semibold text-gray-700 text-center">Settings project</p>
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
                        value={initailProject?.name}
                        onChange={(e) =>
                            setInitialProject(prev => ({ ...(prev ?? {}), name: e.target.value } as ProjectCache))
                        }
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <div className="text-xs font-semibold text-gray-600 flex items-center gap-1">Tags</div>


                    {/* Input + Button */}
                    <div className="flex items-center gap-2">
                        <Input
                            className="text-xs"
                            placeholder="Add tag and press Enter"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddTag();
                                }
                            }}
                        />
                        <Button size="sm" onClick={handleAddTag} className="text-xs">
                            Add
                        </Button>
                    </div>


                    {/* Tag List */}
                    <div className="flex flex-wrap gap-2 mt-1">
                        {initailProject?.tags?.map((tag) => (
                            <div
                                key={tag}
                                className="px-2 py-1 bg-gray-200 text-xs rounded flex items-center gap-1"
                            >
                                {tag}
                                <button onClick={() => handleRemoveTag(tag)}>
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
                <Button
                    className={cn("cursor-pointer select-none bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center",
                        (!initailProject?.name || initailProject.name.trim() === '') && 'bg-gray-200/80 text-gray-600'
                    )}
                    size={'sm'}
                    disabled={!initailProject?.name || initailProject.name.trim() === '' || status === 'updating'}
                    onClick={handleUpdateProject}
                >
                    {status === 'updating' && (
                        <LoaderCircle className="mr-2 animate-spin text-blue-300" strokeWidth={3} />
                    )}
                    Update project
                </Button>
            </div>
        </>
    )
}