'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import React, { useState, useEffect } from "react";
import { PreviewCard } from "./preview-card";
import { Circle, LoaderCircle, Mail } from "lucide-react";
import { useProjectStore } from "@/hooks/useProjects.hook";
import { toast } from "sonner";
import { ProjectSchema, ProjectFormType } from "@/model/validate/project";
import { Combobox } from "@/components/selector/combobox";
import { MultiEmailInput } from "./sub-create-project/invite-member-form";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { TemplateColumnForm } from "./sub-create-project/template-column-form";

interface CreateProjectFormProps {
    onCloseNewProject: (value: boolean) => void;
}
export const CreateProjectForm = ({
    onCloseNewProject,
}: CreateProjectFormProps) => {
    const { data: session } = useSession();
    const router = useRouter();
    if (!session) {
        router.push('/login');
        toast.error('Unauthentication.')
        return;
    }

    const { status, createProject } = useProjectStore();
    const [projectForm, setProjectForm] = useState<ProjectFormType>({
        name: "",
        description: "",
        ownerId: session.user.id,
        members: [
            { userId: session.user.id, role: 'owner', joinedAt: new Date() }
        ],
        tags: [],
        archived: false,
    });
    const [formType, setFormType] = useState<'invite' | 'template-column' | 'create-project'>('create-project');

    const onCreateProject = async () => {
        try {
            const parsed = ProjectSchema.parse(projectForm);
            const normalized = {
                ...parsed,
                members: parsed.members?.map(m => ({
                    ...m,
                    role: m.role || "viewer",
                    joinedAt: m.joinedAt || new Date(),
                })) || [],
                archived: parsed.archived ?? false,
            };
            await createProject(normalized);
            // setFormType('template-column');
            toast.success('Created project success.');
        } catch (error: any) {
            toast.error(error.message);
            console.log('error cannot create project: ', error);
        }
    }

    return (
        <div className="w-full grid grid-cols-2">
            {formType === 'create-project' && (
                <>
                    <div className="w-full max-h-[80vh] h-[80vh] flex justify-end pt-14">
                        <div className="flex flex-col gap-2 max-w-[500px] w-full p-4">
                            <span className="text-2xl font-[700] text-gray-700">Create Project</span>
                            <span className="text-gray-500 text-sm">Define project settings and objectives to begin.</span>
                            <div className="flex flex-col gap-1 p-1 mt-10">
                                <div className="flex flex-col gap-6">
                                    <div className="flex flex-col gap-2">
                                        <div className="text-sm font-semibold text-gray-600">Project Name *</div>
                                        <Input
                                            placeholder="E.g., Website Redesign"
                                            value={projectForm?.name || ''}
                                            onChange={(e) =>
                                                setProjectForm(prev => ({ ...prev, name: e.target.value }))
                                            }
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <div className="text-sm font-semibold text-gray-600">Description</div>
                                        <Textarea
                                            placeholder="Brief description of your project..."
                                            value={projectForm?.description || ''}
                                            onChange={(e) =>
                                                setProjectForm(prev => ({ ...prev, description: e.target.value }))
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end items-center mt-8">
                                    <Button
                                        className={cn("cursor-pointer select-none bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center",
                                            (!projectForm?.name || projectForm.name.trim() === '') && 'bg-gray-200/80 text-gray-600'
                                        )}
                                        size={'sm'}
                                        disabled={!projectForm?.name || projectForm.name.trim() === '' || status === 'creating'}
                                        onClick={onCreateProject}
                                    >
                                        {status === 'creating' && (
                                            <LoaderCircle className="mr-2 animate-spin text-blue-300" strokeWidth={3} />
                                        )}
                                        Create project
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="max-h-[80vh] h-[80vh] w-full flex flex-col items-center px-auto pt-20">
                        <PreviewCard name={projectForm?.name} description={projectForm?.description} />
                    </div>
                </>
            )}
            {/* {formType === 'template-column' && (
                <div className="col-span-2 w-full max-h-[80vh] h-[80vh] flex flex-col items-center">
                    <div className="text-xl font-semibold mb-8">Choose your column template</div>
                    <TemplateColumnForm />
                </div>
            )} */}
             {formType === 'invite' && (
                <div className="col-span-2 w-full max-h-[80vh] h-[80vh] flex justify-center items-center">
                    <MultiEmailInput onCloseNewProject={onCloseNewProject} />
                </div>
            )}
        </div>

    )
}