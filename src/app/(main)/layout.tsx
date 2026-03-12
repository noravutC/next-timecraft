'use client';
import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
// components
import { HeaderMenu } from "@/components/menu-bar/header-menu";
import { ProjectProvider } from "@/context/project-tab";
import LogoAnimationLoop from "@/components/logo-space/logo-animation-loop";

export default function RootLayout({ children }: { children: React.ReactNode }) {
    const { status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "unauthenticated") {
            router.replace("/login");
        }
    }, [status, router]);

    if (status === "loading") {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <LogoAnimationLoop />
            </div>
        );
    }

    if (status === "unauthenticated") {
        return null;
    }

    return (
        <div className="max-w-screen max-h-screen h-full w-full overflow-hidden">
            <div className="flex flex-col h-full">
                <div className="max-w-[100vw] min-h-max min-w-[100vw] border-b p-2">
                    <HeaderMenu />
                </div>
                <div className="flex-1 flex max-h-screen h-full">
                    <div className="w-full p-2 h-full overflow-hidden">
                        <ProjectProvider>
                            {children}
                        </ProjectProvider>
                    </div>
                </div>
            </div>
        </div>
    )
}
