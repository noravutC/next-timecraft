import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge"
import { hexToRgba } from "@/helper/utils";

interface ColumnPreviewProps {
    colName: string;
    color: string;
}
export const ColumnPreview = ({
    colName,
    color,
}: ColumnPreviewProps) => {
    const targetOpacity = 0.6;
    const backgroundStyle = color ? { background: hexToRgba(color, targetOpacity) } : {};
    return (
        <div className="flex flex-col gap-2">
            {/* Title Column */}
            <div
                className={cn("border rounded p-2 min-h-max h-full flex items-center gap-4 justify-between")}
                style={backgroundStyle}
            >
                <span className="font-semibold text-xs">{colName}</span>
                <div className="flex gap-2 items-center">
                    <Badge variant={'outline'} className="rounded-full text-xs bg-white text-gray-500 flex items-center text-start">
                        <div>task</div>
                    </Badge>
                </div>
            </div>
            <div className="w-full h-[80px] border border-dashed border-gray-500 rounded"></div>
        </div>
    )
}