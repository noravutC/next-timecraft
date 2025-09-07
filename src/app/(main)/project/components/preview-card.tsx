'use client';

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProjectStore } from "@/hooks/useProjects.hook";
import { AvatarImage } from "@radix-ui/react-avatar";
import { Calendar, EllipsisVertical, Tag, Users } from "lucide-react";
import React, { useState, useEffect } from "react";
import { formatDateToString } from "@/helper/utils";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface PreviewCardProps {
    // projectId?: string;
    name?: string;
    description?: string;
}
export const PreviewCard = ({
    name,
    description,
}: PreviewCardProps) => {
    const exampleMembers = [
        { userId: '1', name: 'Alice' },
        { userId: '2', name: 'Bob' },
        { userId: '3', name: 'Charlie' },
        { userId: '4', name: 'David' },
        { userId: '5', name: 'Eva' },
    ]

    return (
        <div
            className={
                cn("relative border p-4 rounded-lg shadow-md flex flex-col justify-between",
                    "gap-2 max-w-[400px] min-w-[350px] w-full max-h-[250px] h-[250px]")
            }
        >
            <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    <span className={cn("text-xl font-[700] text-gray-700")}>
                        {(!name || name === '') ? 'Undefined project name' : name}
                    </span>
                </div>
                <span className="text-sm text-muted-foreground line-clamp-2 text-gray-500 pr-4 max-h-[40px] h-[40px]">
                    {(!description || description === '') ? 'Undefined project description' : description}
                </span>
                <div className="flex gap-4 flex-wrap items-center h-fit">
                    <Badge className="flex gap-1 items-center justify-start bg-gray-100 w-[40px] h-[15px] border-none" variant={'outline'}></Badge>
                    <Badge className="flex gap-1 items-center justify-start bg-gray-100 w-[50px] h-[15px] border-none" variant={'outline'}></Badge>
                    <Badge className="flex gap-1 items-center justify-start bg-gray-100 w-[65px] h-[15px] border-none" variant={'outline'}></Badge>
                </div>
            </div>
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between my-2 mt-4">
                    <div className="flex items-center justify-start gap-4">
                        <div className="*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2 *">
                            {exampleMembers.slice(0, 5).map((member) => (
                                <div key={member.userId} className="size-7 bg-gray-100 rounded-full border-white border-2"></div>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center justify-start gap-2">
                        <Badge className="flex gap-2 items-center justify-start h-[15px] w-[50px]" variant={'secondary'}>
                        </Badge>
                    </div>
                </div>
                <div className="border-b" />
                <div className="p-2 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="h-[20px] w-[100px] rounded-full bg-gray-200"></div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-[20px] w-[100px] rounded-full bg-gray-200"></div>
                    </div>
                </div>
            </div>
        </div>
    )
}