'use client';
import React, { useState } from "react";
// context
import { CurrentUserProvider } from "@/context/current-user-context";
// components
import { HeaderMenu } from "@/components/menu-bar/header-menu";
import { MenuRender } from "@/components/menu-bar/menu-render";
import { SidebarMenu } from "@/components/menu-bar/sidebar-menu";
// utils
import { cn } from "@/lib/utils";

export default function RootLayout({ children }: { children: React.ReactNode }) {
    const [isPanelOpen, setIsPanelOpen] = useState<boolean>(true);
    const handlePanelControl = (value: boolean) => {
        setIsPanelOpen(value);
    }
    return (
        <CurrentUserProvider>
            <div className="max-h-[100vw] max-h-[100vh] h-full w-full overflow-hidden">
                <div className="flex flex-col">
                    <div className="max-w-[100vw] min-h-[7vh] max-h-[7vh] min-w-[100vw] border-b">
                        <HeaderMenu />
                    </div>
                    <div className="flex max-h-[calc(100vh-7vh)] h-[calc(100vh-7vh)]">
                        <div className={cn(`duration-300 max-h-[calc(100vh-7vh)] h-[calc(100vh-7vh)] w-full`, isPanelOpen ? "max-w-[250px]" : "max-w-[50px]")}>
                            <SidebarMenu handlePanelControl={handlePanelControl} isPanelOpen={isPanelOpen} >
                                <MenuRender />
                            </SidebarMenu>
                        </div>
                        <div className="w-full p-2 max-h-[calc(100vh-7vh)] h-[calc(100vh-7vh)] overflow-hidden">
                            {/* Content */}
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </CurrentUserProvider>
    )
}