import { cn } from "@/lib/utils";
import React from "react";

interface TabProjectProps {
    tabValue: string;
    selectTab: (tab: string) => void;
}
export const TabProject = ({
    tabValue,
    selectTab
}: TabProjectProps) => {
    const tabs = ["Summary", "Kanban", "Calendar", "Board Templates", "Files"];
    return (
        <div className="px-8 w-full h-[55px] min-h-[55px] flex items-end border-b gap-4">
            {tabs.map((tab) => (
                <div
                    key={tab}
                    onClick={() => selectTab(tab)}
                    className={cn(
                        "relative flex flex-col cursor-pointer h-full justify-center items-center px-2 duration-200",
                        "hover:text-blue-500"
                    )}
                >
                    <span className={cn("text-sm font-semibold", tabValue === tab && "text-blue-500")}>{tab}</span>
                    <div
                        className={cn(
                            "absolute bottom-0 w-full h-[3.5px] transition-colors duration-200",
                            tabValue === tab ? "bg-blue-500" : "bg-transparent"
                        )}
                    />
                </div>
            ))}
        </div>
    )
}