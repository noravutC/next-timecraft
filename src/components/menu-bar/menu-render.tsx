'use client';
import React, { useState } from "react";
import { FolderKanban, LayoutGrid } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const menuItems = [
    { id: '1', label: "Dashboard", url: '/home', icon: LayoutGrid },
    { id: '2', label: "Project", url: '/project', icon: FolderKanban },
]
export const MenuRender = () => {
    const router = useRouter();
    const pathname = usePathname();
    const [activeMenu, setActiveMenu] = useState<string>(pathname);
    return (
        <div className="w-full flex flex-col">
            {menuItems.map((item) => (
                <div
                    className={cn(`rounded p-2 flex justifty-start gap-2 items-center duration-200 cursor-pointer`,
                        item.id === activeMenu ? "bg-blue-100 hover:bg-blue-200 text-blue-700" : "hover:bg-gray-100 text-gray-600")
                    }
                    key={item.id}
                    onClick={() => {
                        router.push(item.url);
                        setActiveMenu(item.id);
                    }}
                >
                    <item.icon className="size-4 mr-2" />
                    <span className="text-sm font-semibold">
                        {item.label}
                    </span>
                </div>
            ))}
        </div>
    )
}