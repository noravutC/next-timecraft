'use client';
import React from "react";
import { signOut } from "next-auth/react";
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
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useCurrentUserContext } from "@/context/current-user-context";
import { Logo } from "../logo-space/logo";

export const HeaderMenu = () => {
    const { currentUser } = useCurrentUserContext();
    return (
        <div className="w-full flex justify-between items-center h-[7vh] p-4">
            <div>
                <Logo />
            </div>
            <div className="items-center flex">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Avatar className="cursor-pointer">
                            {currentUser ? (
                                <>
                                    <AvatarImage src={currentUser.avatar} alt={currentUser.fullName ?? ''} loading="lazy" />
                                    <AvatarFallback className="text-xs font-semibold">
                                        {currentUser.fullName
                                            ?.split(' ')
                                            .map(word => word[0])
                                            .join('')
                                            .toUpperCase()
                                        }
                                    </AvatarFallback>
                                </>
                            ) : (
                                <>
                                    <AvatarFallback className="text-xs font-semibold">
                                        UNK
                                    </AvatarFallback>
                                </>
                            )}

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