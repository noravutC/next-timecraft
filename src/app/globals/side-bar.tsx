"use client";
import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
// hooks
import { useProjectStore } from "@/hooks/useProjects.hook";
// components
import { Button } from "@/components/ui/button";
import { ChevronDown, Briefcase, List, ClipboardList } from "lucide-react";
import { CollapsButton, type CollapsButtonMenu } from "./sidebar-components/button-collaps";
// types
import { Project } from "@/types";

interface SidebarProps {
    childrenHeader?: React.ReactNode;
    childrenFooter?: React.ReactNode;
}

export const Sidebar = ({
    childrenHeader,
}: SidebarProps) => {
    const { fetchProjects } = useProjectStore();

    // const [projects, setProjects] = useState<Projects[]>([]);
    const [defaultMenuItems, setDefaultMenuItems] = useState<CollapsButtonMenu[]>([]);
    const [isPanelOpen, setIsPanelOpen] = useState(true);
    const [isRotated, setIsRotated] = useState(false);
    const pathname = usePathname();
    const TogglePanel = () => {
        setIsRotated((prev) => !prev);
        setIsPanelOpen(!isPanelOpen);
    }

    useEffect(() => {
        const loadProjects = async () => {
            const response = await fetchProjects();
            const projects = response || [];
            if (projects.length > 0) {
                // console.log("Projects: ", response.data);
                const projectsMenu: CollapsButtonMenu = {
                    mainLabel: "Projects",
                    mainIcon: <ClipboardList size={10} strokeWidth={2} />,
                    menuOptions: projects.map((project: Project) => ({
                        label: project.name,
                        icon: <div className="w-6 h-6 border rounded" />,
                        link: `/project/${project._id}`,
                        view: true,
                    }))
                }
                projectsMenu.menuOptions?.push({
                    label: `All Projects`,
                    icon: <List size={14} strokeWidth={3} />,
                    link: `/project`,
                    view: true,
                })
                setDefaultMenuItems([projectsMenu]);
            }
        };

        loadProjects();
    }, []);
    return (
        <div className="relative flex bg-white w-[fit-content] h-full">
            <div
                className="relative h-full bg-white transition-all duration-300 ease-in-out"
                style={{
                    width: isPanelOpen ? "240px" : "30px",
                }}
            >
                <div
                    className="relative flex flex-col bg-white max-w-[240px] h-full p-2"
                    style={{
                        transform: isPanelOpen ? 'translateX(0)' : 'translateX(-1000%)',
                        transition: 'transform 0.3s ease',
                    }}
                >

                    {/* Header */}
                    <div className="h-20 bg-white flex items-center justify-center overflow-hidden">
                        {childrenHeader}
                    </div>

                    {/* Scrollable Content */}
                    <div
                        className="flex-1 overflow-y-auto flex flex-col scrollbar-hide scrollbar-none my-4"
                        style={{
                            scrollbarWidth: "none",
                        }}
                    >
                        {!isRotated && (
                            <>
                                {defaultMenuItems.map((item, index) => (
                                    <CollapsButton
                                        key={index}
                                        mainLabel={item.mainLabel}
                                        mainIcon={item.mainIcon}
                                        menuOptions={item.menuOptions}
                                        pathname={pathname}
                                    />
                                ))}
                            </>
                        )}
                    </div>
                </div>
            </div>
            <div className="relative bg-white z-2 min-w-[30px] h-full flex items-center justify-center">
                <div className="min-w-[3px] bg-[#EEEFF2] h-[-webkit-fill-available]"></div>
                <div
                    className="absolute top-[20px] left-0 right-0 w-[30px] h-[30px]
                    bg-[#fff] hover:bg-[#0C66E4] hover:text-white 
                    transition-transform duration-300 ease-in-out
                    flex justify-center items-center 
                    rounded-full border border-[#DCDFE4]"
                    style={{
                        transform: isRotated ? 'rotate(90deg)' : 'rotate(-90deg)',
                        transition: 'transform 0.3s ease',
                    }}
                    onClick={TogglePanel}
                >
                    <ChevronDown className="opacity-[70%]" size={16} strokeWidth={3} />
                </div>
            </div>
        </div>
    );
}