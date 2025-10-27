import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserStore } from "@/hooks";
import { User } from "lucide-react";
import React from "react";
interface PreviewMembersProps {
    assinees: string[];
}
export const PreviewMembers = ({
    assinees,
}: PreviewMembersProps) => {
    const { getUserById } = useUserStore();
    const userAsMember = (assinees ?? []).map((id) => {
        return getUserById(id);
    }).filter((item) => item !== undefined);
    return (
        <div className="*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:grayscale">
            {(userAsMember ?? []).map((u) => (
                <Avatar key={u._id} className="size-4 h-6 w-6">
                    <AvatarImage src={u.avatar} alt="@shadcn" />
                    <AvatarFallback>
                        <User size={14} strokeWidth={3} />
                    </AvatarFallback>
                </Avatar>
            ))}
        </div>
    )
}
