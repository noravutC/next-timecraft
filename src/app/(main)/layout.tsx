'use client';
import React, { useState } from "react";
// context
import { CurrentUserProvider } from "@/context/current-user-context";
// components
import { HeaderMenu } from "@/components/menu-bar/header-menu";
// import { MenuRender } from "@/components/menu-bar/menu-render";
// import { SidebarMenu } from "@/components/menu-bar/sidebar-menu";
// utils
import { cn } from "@/lib/utils";
import { ProjectProvider } from "@/context/project-tab";

export default function RootLayout({ children }: { children: React.ReactNode }) {
    const [isPanelOpen, setIsPanelOpen] = useState<boolean>(true);
    const handlePanelControl = (value: boolean) => {
        setIsPanelOpen(value);
    }
    return (
        <CurrentUserProvider>
            <div className="max-w-screen max-h-screen h-full w-full overflow-hidden">
                <div className="flex flex-col h-full">
                    <div className="max-w-[100vw] min-h-[7vh] max-h-[7vh] min-w-[100vw] border-b">
                        <HeaderMenu />
                    </div>
                    <div className="flex-1 flex max-h-screen h-full bg-gray-50">
                        <div className="w-full p-2 h-full overflow-hidden">
                            {/* Content */}
                            <ProjectProvider>
                                {children}
                            </ProjectProvider>
                        </div>
                    </div>
                </div>
            </div>
        </CurrentUserProvider>
    )
}