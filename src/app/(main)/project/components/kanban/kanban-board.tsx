
import { useColumnStore } from '@/hooks';
import { CircleAlert, LoaderCircle, Plus } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { BoardColumn } from './board-column';
import { LoaderPage } from '@/components/Loader-page';
import { HorizontalMouseWheelScrollArea } from './ui-customize/horizontal-scroll-area-wheel';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from '@/components/ui/input';
import { ColorPicker } from './ui-customize/color-picker';

interface KanbanBoardProps {
    projectId: string | null | undefined;
}

const resetColumnState = {
    name: null,
    color: null,
    order: null,
};

export const KanbanBoard = ({
    projectId,
}: KanbanBoardProps) => {
    const {
        fetchColumnsByProjectId,
        createColumn,
        clearColumns,
        columns,
        status
    } = useColumnStore();
    const [openDropdown, setOpenDropdown] = useState(false);
    const [columnState, setColumnState] = useState<{
        name: string | null;
        color: string | null;
        limitTask?: number;
        order: number | null;
    }>(resetColumnState);

    const columnInProject = Object.values(columns);

    const lastOrderColumn = useMemo(() => {
        return columnInProject.reduce((max, col) => col.order > max ? col.order : max, 0);
    }, [columnInProject]);

    const handleCreateColumn = () => {
        if (!projectId) return;
        if (!columnState.name || !columnState.color) return;
        createColumn(projectId, {
            name: columnState.name,
            color: columnState.color,
            order: lastOrderColumn + 1,
            wipLimit: columnState.limitTask,
        });
        setOpenDropdown(false);
        setColumnState(resetColumnState);
    }

    useEffect(() => {
        if (projectId) {
            clearColumns();
            fetchColumnsByProjectId(projectId ?? '');
        }
    }, [projectId]);

    return (
        <>
            <div className='h-max w-full px-6 pt-2'>
                <DropdownMenu open={openDropdown} onOpenChange={setOpenDropdown}>
                    <DropdownMenuTrigger asChild>
                        <Button variant={'outline'} size={'sm'} className='cursor-pointer flex items-center'>
                            <Plus className='size-4' />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side='right' align="start" className='min-w-[350px] min-h-fit p-4'>
                        <div className='grid grid-cols-2 gap-2'>
                            <div className="col-span-2 flex flex-col gap-2">
                                <div className="text-sm font-semibold text-gray-600">Column Name</div>
                                <Input
                                    placeholder="Column name..."
                                    inputSize='sm'
                                    value={columnState?.name || ''}
                                    onChange={(e) =>
                                        setColumnState(prev => ({ ...prev, name: e.target.value }))
                                    }
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="text-sm font-semibold text-gray-600">Color</div>
                                <ColorPicker
                                    onChange={(color) => setColumnState(prev => ({ ...prev, color: color }))} />
                            </div>
                            <div className='col-span-2 w-full flex justify-end pt-2'>
                                <Button onClick={handleCreateColumn} disabled={status !== 'none'}>
                                    {status === 'creating' && (
                                        <LoaderCircle className="mr-2 animate-spin text-blue-300" strokeWidth={3} />
                                    )}
                                    Create Column
                                </Button>
                            </div>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* <Input type='color' className='!border-none !shadow-none' /> */}
            </div>
            <div className='w-full max-h-[70vh] h-[70vh] flex items-start justify-center'>
                {!projectId ? (
                    <div className='h-[65vh] w-full flex justify-center items-center gap-2'>
                        <CircleAlert className='text-gray-600 size-5' />
                        <span className='font-semibold text-sm text-gray-600'>Not selected project</span>
                    </div>
                ) : (
                    <HorizontalMouseWheelScrollArea
                        className="max-w-[80vw] w-full max-h-[60vh] h-[60vh] pr-4"
                    >
                        <div className="flex min-w-full h-[60vh] items-end gap-4 p-4">
                            {status !== "none" ? (
                                <div className='max-w-[80vw] w-full h-[60vh] flex justify-center items-center'>
                                    <LoaderPage ballSize={3} />
                                </div>
                            ) : (
                                <>
                                    {columnInProject.map((col) => (
                                        <BoardColumn
                                            key={col._id}
                                            column={col}
                                        />
                                    ))}
                                </>
                            )}
                        </div>
                    </HorizontalMouseWheelScrollArea>
                )}
            </div>
        </>
    )
}