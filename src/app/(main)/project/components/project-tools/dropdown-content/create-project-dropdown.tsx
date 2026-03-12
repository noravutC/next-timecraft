"use client";

import { Button } from "@/components/ui/button"
import { ImagePlus, LoaderCircle, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Dispatch, SetStateAction, useState } from "react"
import { cn } from "@/lib/utils"
import { useProjectStore } from "@/store";
import { toast } from "sonner";

const MAX_PROJECT_COVER_FILE_SIZE = 2 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/avif",
];

const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
    });

interface CreateProjectDropdownProps {
    setSubmenuOpen: Dispatch<SetStateAction<"new-project" | "settings" | null>>
}
export const CreateProjectDropdown = ({
    setSubmenuOpen,
}: CreateProjectDropdownProps) => {
    const { createProject, status } = useProjectStore();

    const [newProject, setNewProject] = useState<{
        name: string;
        description?: string;
        coverImage?: string | null;
    }>({
        name: '',
    });

    const onCoverFileChange = async (file: File | null) => {
        if (!file) {
            setNewProject((prev) => ({ ...prev, coverImage: null }));
            return;
        }

        if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
            toast.error("Please upload JPG, PNG, WEBP, GIF, or AVIF.");
            return;
        }

        if (file.size > MAX_PROJECT_COVER_FILE_SIZE) {
            toast.error("Project image must be 2MB or less.");
            return;
        }

        try {
            const dataUrl = await fileToDataUrl(file);
            setNewProject((prev) => ({ ...prev, coverImage: dataUrl }));
        } catch (error) {
            console.error("Unable to read project image:", error);
            toast.error("Unable to read selected image.");
        }
    };

    const handleCreateProject = async () => {
        if (!newProject || !newProject.name || newProject.name === '') {
            return;
        }

        try {
            await createProject({
                name: newProject.name,
                description: newProject.description ?? undefined,
                coverImage: newProject.coverImage ?? null,
            });
            setSubmenuOpen(null);
        } catch (error) {
            console.error("Unable to create project:", error);
            toast.error("Unable to create project.");
        }
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
                <div className="flex flex-col gap-2">
                    <div className="text-xs font-semibold text-gray-600">Project image</div>
                    {newProject.coverImage ? (
                        <div className="relative h-24 w-full overflow-hidden rounded-md border border-gray-200">
                            <img src={newProject.coverImage} alt="Project cover preview" className="h-full w-full object-cover" />
                            <Button
                                type="button"
                                variant="secondary"
                                size="icon"
                                className="absolute right-1.5 top-1.5 size-6"
                                onClick={() => setNewProject((prev) => ({ ...prev, coverImage: null }))}
                            >
                                <X className="size-3.5" />
                            </Button>
                        </div>
                    ) : (
                        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-gray-300 bg-gray-50 px-2 py-4 text-xs font-medium text-gray-600 hover:border-blue-400 hover:text-blue-600">
                            <ImagePlus className="size-4" />
                            Upload image (max 2MB)
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(event) => onCoverFileChange(event.target.files?.[0] ?? null)}
                            />
                        </label>
                    )}
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
