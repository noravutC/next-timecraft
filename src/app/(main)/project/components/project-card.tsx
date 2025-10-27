'use client';

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AvatarImage } from "@radix-ui/react-avatar";
import { Calendar, EllipsisVertical, Tag, Users } from "lucide-react";
import React, { useState, useEffect, useMemo } from "react";
import { formatDateToString } from "@/helper/utils";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useUserStore, useProjectStore } from "@/hooks";

interface ProjectCardProps {
    projectId?: string;
}
export const ProjectCard = ({
    projectId,
}: ProjectCardProps) => {
    const { getProjectById } = useProjectStore();
    const { fetchUsersByIds, getUsersByIds } = useUserStore();
    const router = useRouter();
    const validProjectId = projectId ?? '';
    const project = getProjectById(validProjectId);
    const [isHovered, setIsHovered] = useState<boolean>(false);

    const userIds = useMemo(() => {
        return project?.members.map((member) => member.userId) ?? [];
    }, [project]);

    useEffect(() => {
        if (userIds.length > 0) {
            fetchUsersByIds(userIds);
        }
    }, [fetchUsersByIds, userIds]);

    const membersInProject = getUsersByIds(userIds);

    return (
        <div
            className="relative border p-4 rounded-lg shadow-md flex flex-col justify-between  gap-2 w-full max-h-[200px] h-[200px]"
            onClick={() => router.push(`/project/${projectId}`)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    <span
                        className={cn("text-xl font-[700] duration-200", isHovered ? "text-blue-600 cursor-pointer scale-[1.01]" : "text-gray-700")}

                    >
                        {project?.name}
                    </span>
                    {isHovered && (
                        <Button type="button" variant="ghost" className="absolute right-4 p-1 cursor-pointer" size={'sm'}>
                            <EllipsisVertical className="rotate-90" size={10} />
                        </Button>
                    )}
                </div>
                <div className="flex gap-4 flex-wrap items-center h-fit">
                    {(project?.tags ?? []).map((tag) => (
                        <Badge key={tag} className="flex gap-1 items-center justify-start" variant={'outline'}>
                            <Tag size={10} />
                            {tag}
                        </Badge>
                    ))}
                </div>
            </div>
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between my-2 mt-4">
                    <div className="flex items-center justify-start gap-4">
                        <div className="*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2 *">
                            {membersInProject.slice(0, 5).map((user) => (
                                <Avatar key={user._id} className="size-7">
                                    <AvatarImage src={user.avatar} alt={user.fullName} />
                                    <AvatarFallback>{user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}</AvatarFallback>
                                </Avatar>
                            ))}
                            {((project?.members.length ?? 0) - 5) > 0 && (
                                <Avatar className="size-7 bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-semibold">
                                    +{(project?.members.length ?? 0) - 5}
                                </Avatar>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            <Users className="size-4 text-gray-500" />
                            <span className="text-xs text-gray-500 font-semibold">
                                {project?.members.length ?? '0'} members
                            </span>
                        </div>
                    </div>
                </div>
                <div className="border-b" />
                <div className="p-2 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Calendar size={13} className="text-gray-700" />
                        <span className="text-xs text-gray-700 font-semibold">
                            Created {project?.createdAt ? formatDateToString(project?.createdAt) : '-'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar size={13} className="text-gray-700" />
                        <span className="text-xs text-gray-700 font-semibold">
                            Updated {project?.createdAt ? formatDateToString(project?.updatedAt) : '-'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}