'use client';

import { LoaderCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from '@/components/ui/input';
import { ColorPicker } from './color-picker';
import { useState } from 'react';
import { useBoardStore } from '@/hooks';

const resetColumnState = {
    name: null,
    color: null,
    order: null,
};

interface CreateColumnProps {
    projectId: string | undefined | null;
    lastOrderColumn: number;
}
export const CreateColumn = ({
    projectId,
    lastOrderColumn,
}: CreateColumnProps) => {
    const { createColumn, status } = useBoardStore();
    const [openDropdown, setOpenDropdown] = useState(false);
    const [columnState, setColumnState] = useState<{
        name: string | null;
        color: string | null;
        limitTask?: number;
        order: number | null;
    }>(resetColumnState);

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
    return (
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
        </div>
    )
}