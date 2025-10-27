import { cn } from "@/lib/utils";
import React from "react";
import { useProjectTab } from "../context/project-tab-context";
import { Columns3, Calendar, Layers2, LayoutDashboard, LayoutTemplate } from "lucide-react";


export const TabProject = () => {
    const { tabValue, setTabValue } = useProjectTab();
    const tabs = [
        { label: "Summary", icon: LayoutDashboard },
        { label: "Board", icon: Columns3 },
        { label: "Calendar", icon: Calendar },
        { label: "Templates", icon: Layers2 }
    ];
    return (
        <div
            className="absolute bottom-4 left-0 right-0 max-w-[450px] 
                mx-auto h-[45px] min-h-[45px] rounded-md border flex items-center justify-between text-sm gap-2 p-1 bg-white"
        >
            {/* <Columns3 /> */}
            {tabs.map((tab) => (
                <div
                    key={tab.label}
                    onClick={() => setTabValue(tab.label)}
                    className={cn(
                        "w-full relative cursor-pointer h-full duration-200 rounded-sm overflow-hidden text-gray-700",
                        "hover:text-blue-500 hover:bg-blue-50"
                    )}
                >
                    <span
                        className={cn("text-sm flex justify-center items-center font-semibold w-full h-full",
                            tabValue === tab.label && "bg-blue-50 text-blue-500")}>
                               <tab.icon className="size-4 mr-2" />
                        {tab.label}
                    </span>
                </div>
            ))}
        </div>
    )
}