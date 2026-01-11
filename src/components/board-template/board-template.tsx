import { ColumnPreview } from "@/components/kanban-preview/column-preview";
import { LayoutPreview } from "@/components/kanban-preview/layout-preview";
import { useTemplateColumnsStore } from "@/hooks/useTemplateColumn.hook";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { TemplateColumn } from "@/types/template-column";
import { LoaderCircle } from "lucide-react";

interface BoardTemplateProps {
    projectId: string | null | undefined;
}

export const BoardTemplate = ({
    projectId,
}: BoardTemplateProps) => {
    const {
        fetchTemplateColumns,
        templateColumns,
        applyBoardTemplateIntoProject,
        status,
    } = useTemplateColumnsStore();
    const [onTriggerTemplateId, setOnTriggerTemplateId] = useState<string | null>(null);

    const columnsKeys = Object.keys(templateColumns);
    const [onHoverTemplateId, setOnHoverTemplateId] = useState<string | null>(null);

    if (!projectId) return null;
    const templates = columnsKeys.map(key => templateColumns[key]);

    const applyBoardIntoProject = async (template: TemplateColumn) => {
        if (!projectId) return;
        setOnTriggerTemplateId(template._id);
        await applyBoardTemplateIntoProject(projectId, template);
        setOnTriggerTemplateId(null);
    }

    useEffect(() => {
        fetchTemplateColumns();
    }, []);


    return (
        <div className="w-full flex items-center justify-center whitespace-nowrap gap-4 h-fit  gap-6 p-4 border-t border-b">
            {(templates ?? []).map((template) => (
                <div
                    key={template._id}
                    className={
                        cn("flex flex-col col-span-1 border shadow-md min-h-fit rounded-md",
                            "max-w-[350px] w-full"
                        )
                    }
                    onMouseEnter={() => setOnHoverTemplateId(template._id)}
                    onMouseLeave={() => setOnHoverTemplateId(null)}
                >
                    <div className="w-full p-4">
                        <LayoutPreview>
                            {(template.columns ?? []).map((col) => (
                                <ColumnPreview key={col.name} colName={col.name} color={col.color} />
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
                                (template._id === onHoverTemplateId)
                                    ? "opacity-100 translate-x-0"
                                    : "opacity-0 translate-x-2 pointer-events-none"
                            )}
                            disabled={status === 'updating'}
                            onClick={() => applyBoardIntoProject(template)}
                        >
                            {onTriggerTemplateId === template._id && status === 'updating' && (
                                <LoaderCircle className="mr-2 animate-spin text-blue-300" strokeWidth={3} />
                            )}
                            Select Template
                        </Button>
                        
                    </div>
                </div>
            ))}
        </div>
    )
}
