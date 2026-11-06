"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNavStore } from "@/store";
import { Kbd } from "@/components/ui/kbd";
import { signOut, useSession } from "next-auth/react";
import { LogOut } from "lucide-react";
// components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { UserAvatar } from "../people/user-avatar";

export const UserMenu = () => {
  const { data: session } = useSession();
  const fullName =
    session?.user?.fullName ||
    session?.user?.name ||
    session?.user?.email ||
    "";
  const avatar = session?.user?.avatar || session?.user?.image || null;
  // the shortcuts list lives with the board's dialogs
  const onBoard = usePathname().startsWith("/project");
  const setBoardDialog = useNavStore((s) => s.setBoardDialog);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="cursor-pointer rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ink/10"
      >
        <UserAvatar
          name={fullName}
          image={avatar}
          seed={session?.user?.id}
          size="lg"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-58" align="end" sideOffset={8}>
        <div className="mb-1 flex flex-col border-b border-line-soft px-2.5 pt-2 pb-2.5">
          <span className="truncate text-sm font-medium text-ink">
            {fullName || "My account"}
          </span>
          {session?.user?.email && (
            <span className="truncate text-xs text-ink-subtle">
              {session.user.email}
            </span>
          )}
        </div>
        <DropdownMenuItem className="h-8 px-2.5" asChild>
          <Link href="/settings/profile">My account</Link>
        </DropdownMenuItem>
        {onBoard && (
          <DropdownMenuItem
            className="h-8 px-2.5"
            onClick={() => setBoardDialog("shortcuts")}
          >
            <span className="flex-1">Keyboard shortcuts</span>
            <Kbd>?</Kbd>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="h-8.5 px-2.5"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
