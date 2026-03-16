"use client";
import React from "react";
import { signOut, useSession } from "next-auth/react";
// components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Logo } from "../logo-space/logo";
import { Button } from "../ui/button";

export const HeaderMenu = () => {
  const { data: session } = useSession();
  const fullName =
    session?.user?.fullName ||
    session?.user?.name ||
    session?.user?.email ||
    "";
  const avatar = session?.user?.avatar || session?.user?.image || "";
  const initials = fullName
    ? fullName
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
    : "UNK";

  return (
    <div className="w-full flex justify-between items-center min-h-fit">
      <div className="flex items-center gap-4">
        <div className="hover:bg-gray-100 p-1 px-2 cursor-pointer rounded-sm">
          <Logo size={20} textSize="lg" />
        </div>
      </div>
      <div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={"ghost"}
              className="focus-visible:ring-0 px-2 rounded-sm data-[state=open]:bg-gray-100"
            >
              <Avatar className="cursor-pointer size-6">
                {session?.user ? (
                  <>
                    <AvatarImage src={avatar} alt={fullName} loading="lazy" />
                    <AvatarFallback className="text-xs font-semibold">
                      {initials}
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
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-40" align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
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
  );
};
