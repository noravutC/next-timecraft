import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useBoardStore } from "@/hooks";
import { ColumnCache } from "@/types";
import { Ellipsis } from "lucide-react"
import { toast } from "sonner";

interface BoardToolsProps {
    column: ColumnCache
    onFocusBoardTools: {
        hover: boolean;
        active: boolean;
    };
    setOnFocusBoardTools: (value: React.SetStateAction<{
        hover: boolean;
        active: boolean;
    }>) => void;
    setInsertDirection: React.Dispatch<React.SetStateAction<"left" | "right" | null>>
}
export const BoardTools = ({
    column,
    onFocusBoardTools,
    setOnFocusBoardTools,
    setInsertDirection,
}: BoardToolsProps) => {
    const { updateColumnOrder, columns } = useBoardStore();
    if (onFocusBoardTools.hover === false && onFocusBoardTools.active === false) {
        return null;
    }
    const { min, max } = Object.values(columns).reduce(
        (acc, col) => {
            if (col.projectId !== column.projectId) return acc;
            if (col.order < acc.min) acc.min = col.order;
            if (col.order > acc.max) acc.max = col.order;
            return acc;
        },
        { min: Infinity, max: -Infinity }
    );
    const handleUpdateColumn = (direction: 'left' | 'right', mode: 'move' | 'add') => {
        if (mode === 'move') {
            const newOrder = direction === 'left' ? column.order - 1 : column.order + 1;
            if (newOrder < min || newOrder > max) {
                toast.error(`Cannot move ${direction}.`);
                return;
            }

            updateColumnOrder(column._id, { order: newOrder })

        } else if (mode === 'add') {
            // add new column
            // ...
            setInsertDirection(direction);
        }
    }

    return (
        <DropdownMenu
            onOpenChange={(open) =>
                setOnFocusBoardTools(prev => ({
                    hover: open ? true : prev.hover,
                    active: open
                }))
            }
        >
            <DropdownMenuTrigger asChild>
                <Button
                    className="bg-gray-700/40 hover:bg-gray-700/60"
                    size={'xs'}
                    onMouseEnter={() =>
                        setOnFocusBoardTools(prev => ({ ...prev, hover: true }))
                    }
                    onClick={() =>
                        setOnFocusBoardTools(prev => ({ ...prev, active: true }))
                    }
                >
                    <Ellipsis size={14} strokeWidth={3} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-56"
                align="start"
                side="bottom"
                onCloseAutoFocus={(e) => {
                    e.preventDefault();
                }}
            >
                <DropdownMenuLabel>Action</DropdownMenuLabel>
                <DropdownMenuGroup>
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Add column</DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                                <DropdownMenuItem onClick={() => handleUpdateColumn('right', 'add')}>Right</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateColumn('left', 'add')}>Left</DropdownMenuItem>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>
                </DropdownMenuGroup>
                <DropdownMenuGroup>
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Move to</DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                                <DropdownMenuItem onClick={() => handleUpdateColumn('right', 'move')}>Right</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateColumn('left', 'move')}>Left</DropdownMenuItem>
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>

                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
