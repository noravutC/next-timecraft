import { Button } from "@/components/ui/button";
import { ProjectCache } from "@/types";
import { GalleryVerticalEnd } from "lucide-react";
import React from "react";
import { ProjectSwitch } from "./buttons/project-switch";

interface ProjectHeaderProps {
    selectedProject: ProjectCache | null;
}

export const ProjectHeader = ({ selectedProject }: ProjectHeaderProps) => {
    if (!selectedProject) {
        return null;
    }
    return (
        <>
            <div className="flex items-center gap-2">
                <ProjectSwitch selectedProject={selectedProject} />
            </div>
            <div className="flex"></div>
            <div className="flex items-center"></div>
        </>
    );
};
