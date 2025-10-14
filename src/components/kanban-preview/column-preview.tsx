import { Badge } from "../ui/badge"

interface ColumnPreviewProps {
    colName: string;
}
export const ColumnPreview = ({
    colName,
}: ColumnPreviewProps) => {
    return (
        <div className="flex flex-col gap-2">
            {/* Title Column */}
            <div className="border rounded p-2 min-h-max h-full flex items-center gap-4 justify-between">
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