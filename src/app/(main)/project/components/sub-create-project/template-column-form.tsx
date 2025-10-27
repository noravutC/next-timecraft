import { ColumnPreview } from "@/components/kanban-preview/column-preview";
import { LayoutPreview } from "@/components/kanban-preview/layout-preview";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useTemplateColumnsStore } from "@/hooks/useTemplateColumn.hook";
import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { TemplateColumn } from "@/types/template-column";
import { useProjectStore } from "@/hooks";
import { useProjectTab } from "../../context/project-tab-context";

interface TemplateColumnFormProps {
    projectId: string | null | undefined;
    // selectTab: (tab: string) => void;
}

export const TemplateColumnForm = ({
    projectId,
    // selectTab,
}: TemplateColumnFormProps) => {
    const disableSelect = (!!!projectId);
    const {
        fetchTemplateColumns,
        templateColumns,
        status,
    } = useTemplateColumnsStore();
    const { setTabValue } = useProjectTab();
    const { applyBoardIntoProject: applyBoardIntoProjectStore } = useProjectStore();

    const columnsKeys = Object.keys(templateColumns);
    const [onHoverTemplateId, setOnHoverTemplateId] = useState<string | null>(null);

    const templates = columnsKeys.map(key => templateColumns[key]);

    const applyBoardIntoProject = async (template: TemplateColumn) => {
        if (!projectId) return;
        await applyBoardIntoProjectStore(projectId, template);
        setTabValue("Board");
    }

    useEffect(() => {
        fetchTemplateColumns();
    }, []);


    return (
        <div className="w-full h-full grid grid-cols-3 gap-6 p-4">
            {(templates ?? []).map((template) => (
                <div
                    key={template._id}
                    className={
                        cn("flex flex-col col-span-1 border shadow-md min-h-fit rounded-md")
                    }
                    onMouseEnter={() => setOnHoverTemplateId(template._id)}
                    onMouseLeave={() => setOnHoverTemplateId(null)}
                >
                    <div className="w-full p-4">
                        <LayoutPreview>
                            {(template.columns ?? []).map((col) => (
                                <ColumnPreview key={col.name} colName={col.name} />
                            ))}
                        </LayoutPreview>
                    </div>
                    <div className="w-full flex justify-center">
                        <Badge className="rounded-full p-1 px-2 bg-blue-500">{template.columns.length} Column</Badge>
                    </div>
                    {/* Detail Template */}
                    <div className="flex-1 flex flex-col justify-end p-4">
                        <div className="flex-1 flex flex-col gap-2 justify-start items-center">
                            <span
                                className={
                                    cn("text-xl font-[700] duration-300",
                                        template._id === onHoverTemplateId && "text-blue-600")
                                }
                            >
                                {template.name}
                            </span>
                            <span className="text-[0.85rem] text-gray-500">{template.description}</span>
                        </div>
                        <Button
                            className={cn(
                                "transition-all duration-300 mt-4",
                                template._id === onHoverTemplateId
                                    ? "opacity-100 translate-x-0"
                                    : "opacity-0 translate-x-2 pointer-events-none"
                            )}
                            disabled={disableSelect}
                            onClick={() => applyBoardIntoProject(template)}
                        >
                            Select Template
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    )
}
