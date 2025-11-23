'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useUserStore } from "@/hooks";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";
import Image from "next/image";
import React from "react";
interface PreviewMembersProps {
    assinees: string[];
    size?: string;
}
export const PreviewMembers = React.memo(({
    assinees,
    size = 'size-6',
}: PreviewMembersProps) => {
    const { getUserById } = useUserStore();
    const userAsMember = (assinees ?? []).map((id) => {
        const user = getUserById(id);
        return user;
    }).filter((item) => item !== undefined);
    return (
        <>
            {(userAsMember ?? []).map((u) => (
                <React.Fragment key={u._id}>
                    <Tooltip>
                        <TooltipTrigger asChild className="cursor-pointer">
                            <Image
                                src={u.avatar ?? "/default-avatar.png"}
                                alt={u.fullName}
                                width={10}
                                height={10}
                                className={cn("rounded-full object-cover", size)}
                            />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{u.fullName}</p>
                        </TooltipContent>
                    </Tooltip>

                </React.Fragment>
            ))}
            <div className="*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2 *">
            </div>
        </>
    )
})
