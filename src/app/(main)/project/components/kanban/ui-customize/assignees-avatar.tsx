import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserStore } from "@/hooks";
import { CircleUser, Plus, User } from "lucide-react";
import { useEffect, useMemo } from "react";

interface AssigneesAvatarProps {
    userIds: string[];
}

export const AssigneesAvatar = ({
    userIds,
}: AssigneesAvatarProps) => {

    const { fetchUsersByIds, getUsersByIds, status: statusUser } = useUserStore();

    const users = useMemo(() => {
        return getUsersByIds(userIds);
    }, [userIds]);

    useEffect(() => {
        if (userIds) {
            fetchUsersByIds(userIds);
            // console.log('fetch userIds: ', userIds);
        }
    }, [userIds])
    return (
        <div className="*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:grayscale">
            {statusUser === 'fetching' || statusUser === 'creating' ? (
                <>
                    <Avatar className="animate-pulse bg-gray-200 dark:bg-gray-700">
                        <AvatarFallback>
                            <User className="m-0 text-gray-400" size={20} />
                        </AvatarFallback>
                    </Avatar>
                    <Avatar className="animate-pulse bg-gray-200 dark:bg-gray-700">
                        <AvatarFallback>
                            <User className="m-0 text-gray-400" size={20} />
                        </AvatarFallback>
                    </Avatar>
                    <Avatar className="animate-pulse bg-gray-200 dark:bg-gray-700">
                        <AvatarFallback>
                            <User className="m-0 text-gray-400" size={20} />
                        </AvatarFallback>
                    </Avatar>
                </>
            ) : (
                <>
                    {users.map((u) => (
                        <Avatar key={u._id}>
                            <AvatarImage src={u.avatar} alt="@shadcn" />
                            <AvatarFallback>
                                <CircleUser className="m-0" size={13} />
                            </AvatarFallback>
                        </Avatar>
                    ))}
                    {users.length === 0 && (
                        <>
                            {/* <div className="w-6 h-6 rounded-full bg-gray-500 flex items-center justify-center">
                                <Plus className="text-white size-4 " />
                            </div> */}
                        </>
                    )}
                </>
            )}
        </div>
    )
}