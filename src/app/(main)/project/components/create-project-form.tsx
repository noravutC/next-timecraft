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
import { MultiEmailInput } from "./invite-member-form";

export const CreateProjectForm = () => {
    const { status, createProject } = useProjectStore();
    const [projectForm, setProjectForm] = useState<ProjectFormType>({
        name: "",
        description: "",
        ownerId: "66d2a1c5f12a8e7f4a100001",
        members: [],
        tags: [],
        archived: false,
    });
    const [inviteMember, setInviteMember] = useState<boolean>(true);
    const [role, setRole] = useState<string | null>('3');
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
            setInviteMember(true);
            toast.success('Created project success.');
        } catch (error: any) {
            toast.error(error.message);
            console.log('error cannot create project: ', error);
        }
    }

    // const exampleOption = [
    //     { id: '1', name: 'Admin', description: 'Manager all accesses in project' },
    //     { id: '2', name: 'Member', description: 'Manager task in project' },
    //     { id: '3', name: 'View', description: 'View data in project' },
    // ]
    return (
        <div className="w-full grid grid-cols-2">
            {inviteMember && (
                <div className="col-span-2 w-full max-h-[80vh] h-[80vh] flex justify-center items-center">
                    <MultiEmailInput />
                    {/* <div className="max-w-[600px] w-full max-h-[65vh] h-[65vh] rounded shadow-sm border p-8 flex flex-col">
                        <span className="text-lg font-semibold mb-8">Invite people to your project</span>
                        <div className="flex gap-2 items-end justify-start">
                            <div className="flex flex-col gap-2 w-full">
                                <div className="text-sm font-semibold text-gray-600">Email address</div>
                                <Input
                                    placeholder="email@address.com"
                                    value={projectForm?.name || ''}
                                    onChange={(e) =>
                                        setProjectForm(prev => ({ ...prev, name: e.target.value }))
                                    }
                                />
                            </div>
                            <Combobox<{ id: string; name: string; description: string }>
                                data={exampleOption}
                                optionKeys={{
                                    label: 'name',
                                    value: 'id',
                                    description: 'description',
                                }}
                                value={role}
                                setValue={setRole}
                                placeholder={"Select role"}
                                placeholderEmpty={"Not found role"}
                                placeholderSearch={"Search role..."}
                                classNamePopOver="!max-w-[150px]"
                                classNameShowUp="!max-w-[150px] cursor-text"
                            />
                            <Button className="text-sm bg-blue-500 cursor-pointer hover:bg-blue-600 rounded">
                                <Mail size={13} />
                                Invite
                            </Button>
                        </div>
                    </div> */}
                </div>
            )}
            {!inviteMember && (
                <div className="w-full max-h-[80vh] h-[80vh] flex justify-end">
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
            )}
            {!inviteMember && (
                <div className="max-h-[80vh] h-[80vh] w-full flex flex-col items-center px-auto pt-14">
                    <PreviewCard name={projectForm?.name} description={projectForm?.description} />
                </div>
            )}
        </div>

    )
}