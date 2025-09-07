'use client';
import React from "react";
import { useSession, signOut } from "next-auth/react";
// components
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

export const HeaderMenu = () => {
    const { data: session } = useSession();
    // console.log('session: ', session);
    return (
        <div className="w-full flex justify-between items-center h-[7vh] p-4">
            <div></div>
            <div className="items-center flex">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Avatar className="cursor-pointer">
                            <AvatarImage src={session?.user.image ?? ''} alt={session?.user.name ?? ''} />
                            <AvatarFallback className="text-xs font-semibold">
                                {session?.user.name
                                    ?.split(' ')
                                    .map(word => word[0])
                                    .join('')
                                    .toUpperCase()
                                }
                            </AvatarFallback>
                        </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-40" align="end">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuItem
                        className="cursor-pointer"
                            onClick={() => signOut({ callbackUrl: "/" })}
                        >
                            Log out
                            <DropdownMenuShortcut>
                                <LogOut />
                            </DropdownMenuShortcut>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}