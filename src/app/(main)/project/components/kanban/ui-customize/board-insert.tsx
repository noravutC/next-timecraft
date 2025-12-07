import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBoardStore, useProjectStore } from "@/hooks";
import { cn } from "@/lib/utils";
import { Check, LoaderCircle, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { ColorPicker } from "./color-picker";
import { getRandomPastelHex } from "@/helper/random";

interface BoardInsertProps {
    children: React.ReactNode;
    currentOrder: number;
    insertDirection: "left" | "right" | null;
    setInsertDirection: React.Dispatch<React.SetStateAction<"left" | "right" | null>>;
}
export const BoardInsert = ({
    children,
    currentOrder,
    insertDirection,
    setInsertDirection,
}: BoardInsertProps) => {
    return (
        <>
            {insertDirection === 'left' &&
                <BoardInsertInput
                    insertDirection={insertDirection}
                    setInsertDirection={setInsertDirection}
                    currentOrder={currentOrder}
                />}
            {children}
            {insertDirection === 'right' &&
                <BoardInsertInput
                    insertDirection={insertDirection}
                    setInsertDirection={setInsertDirection}
                    currentOrder={currentOrder}
                />}
        </>
    )
}

export const BoardInsertInput = ({
    insertDirection,
    currentOrder,
    setInsertDirection,
}: {
    insertDirection: "left" | "right" | null,
    currentOrder: number,
    setInsertDirection: React.Dispatch<React.SetStateAction<"left" | "right" | null>>
}) => {
    const { projectIdActivate } = useProjectStore();
    const { insertColumnInOrder, status } = useBoardStore();
    const [columnName, setColumnName] = useState("");
    const [columnColor, setColumnColor] = useState(getRandomPastelHex());
    
    const handleCreateBoard = async () => {
        if (columnName.trim() === "" || !projectIdActivate) return;
        console.log('columnColor: ', columnColor);
        await insertColumnInOrder(projectIdActivate, {
            name: columnName,
            color: columnColor,
        }, currentOrder + (insertDirection === 'right' ? 1 : 0));
        setInsertDirection(null);
    }
    return (
        <div
            className="max-h-[450px] h-full min-h-[150px] max-w-[250px] min-w-[250px]
                       z-2 bg-white flex flex-col flex-shrink-0 rounded-md border"
        >
            <div className="flex h-12 items-center justify-between flex-shrink-0 p-3 border-b rounded-t-md">
                <div className="relative w-full">
                    <div className="flex items-center gap-2">
                        <Input
                            autoFocus
                            disabled={status !== 'none'}
                            className="bg-white text-md font-semibold w-full pr-12"
                            value={columnName}
                            onChange={(e) => setColumnName(e.target.value)}
                        />
                        <div className="max-w-[30px] w-full">
                            {status === 'creating' ? (
                                <>
                                    <LoaderCircle className="ml-2 animate-spin text-blue-300" strokeWidth={2} />
                                </>
                            ) : (
                                <ColorPicker defaultColor={columnColor} onChange={setColumnColor} />
                            )}
                        </div>
                    </div>
                    <div className="absolute bottom-[-35px] max-w-40 w-40 min-h-fit flex justify-end gap-1 right-0">
                        <Button
                            variant={'white'}
                            size={'sm'}
                            disabled={status !== 'none'}
                            onClick={handleCreateBoard}
                        >
                            <Check className="size-3 text-gray-600" strokeWidth={3} />
                        </Button>
                        <Button
                            variant={'white'}
                            size={'sm'}
                            disabled={status !== 'none'}
                            onClick={() => setInsertDirection(null)}
                        >
                            <X className="size-3 text-gray-600" strokeWidth={3} />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
