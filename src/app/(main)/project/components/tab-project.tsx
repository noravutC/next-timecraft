import { cn } from "@/lib/utils";
import React from "react";
import { useProjectAtMenu } from "../../../../context/project/project-menu-context";
import { Columns3, Calendar, Layers2, LayoutDashboard } from "lucide-react";


export const TabProject = () => {
    const { menuValue, setMenuValue } = useProjectAtMenu();
    const tabs = [
        { value: "Summary", label: "Summary", icon: LayoutDashboard },
        { value: "Board", label: "Board", icon: Columns3 },
        { value: "Calendar", label: "Calendar", icon: Calendar },
        { value: "Board Templates", label: "Templates", icon: Layers2 }
    ];
    return (
        <div
            className="absolute bottom-4 left-0 right-0 max-w-[450px] min-w-[450px]
                mx-auto h-[45px] min-h-[45px] rounded-md border flex items-center justify-between text-sm gap-2 p-1 bg-white"
        >
            {/* <Columns3 /> */}
            {tabs.map((tab) => (
                <div
                    key={tab.label}
                    onClick={() => setMenuValue(tab.value)}
                    className={cn(
                        "w-full relative cursor-pointer h-full duration-200 rounded-sm overflow-hidden text-gray-700",
                        "hover:text-blue-500 hover:bg-blue-50"
                    )}
                >
                    <span
                        className={cn("text-sm flex justify-center items-center font-semibold w-full h-full",
                            menuValue === tab.value && "bg-blue-50 text-blue-500")}>
                               <tab.icon className="size-4 mr-2" />
                        {tab.label}
                    </span>
                </div>
            ))}
        </div>
    )
}