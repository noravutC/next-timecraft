'use client';
import React from "react";
import { FolderKanban, LayoutGrid, Folder } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const menuItems = [
    { id: '1', label: "Dashboard", url: '/home', icon: LayoutGrid },
    { id: '2', label: "Project", url: '/project', icon: Folder },
];

export const MenuRender = () => {
    const router = useRouter();
    const pathname = usePathname();
    return (
        <div className="w-full flex flex-col">
            {menuItems.map((item) => {
                const isActive = pathname.startsWith(item.url); // ✅ check prefix

                return (
                    <div
                        className={cn(
                            "rounded p-2 flex justify-start gap-2 items-center duration-200 cursor-pointer",
                            isActive
                                ? "bg-blue-100 hover:bg-blue-200 text-blue-700"
                                : "hover:bg-gray-100 text-gray-600"
                        )}
                        key={item.id}
                        onClick={() => router.push(item.url)}
                    >
                        <item.icon className="size-4" />
                        <span className="text-sm font-semibold">{item.label}</span>
                    </div>
                );
            })}
        </div>
    )
}