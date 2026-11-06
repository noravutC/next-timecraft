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
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";

export const UserMenu = () => {
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={"ghost"}
          size="icon"
          aria-label="Account menu"
          className="size-8 rounded-full data-[state=open]:bg-surface-active"
        >
          <Avatar className="cursor-pointer size-7">
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
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel className="flex flex-col gap-0.5 font-normal">
          <span className="truncate text-sm font-medium text-ink">
            {fullName || "My Account"}
          </span>
          {session?.user?.email && (
            <span className="truncate text-xs text-ink-subtle">
              {session.user.email}
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer gap-2.5"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="text-ink-subtle" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
