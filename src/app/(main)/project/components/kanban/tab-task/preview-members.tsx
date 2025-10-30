import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserStore } from "@/hooks";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";
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
        <div className="*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2 *">
            {(userAsMember ?? []).map((u) => (
                <Avatar key={u._id} className={cn(size)}>
                    <AvatarImage src={u.avatar ?? ''} alt="@shadcn" />
                    <AvatarFallback>
                        <User size={14} strokeWidth={3} />
                    </AvatarFallback>
                </Avatar>
            ))}
        </div>
    )
})
