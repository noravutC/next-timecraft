'use client';

import { Textarea } from '@/components/ui/textarea';
import { useTaskStore } from '@/hooks';
import React, { useState } from 'react';

interface PreviewTaskFormProps {
    colId: string;
    handleOpenTaskForm: () => void;
}

export const PreviewTaskForm = ({
    colId,
    handleOpenTaskForm,
}: PreviewTaskFormProps) => {
    const { createTask } = useTaskStore();
    const [taskName, setTaskName] = useState<string | undefined>(undefined);

    const handleCreateTask = () => {
        if (!taskName || taskName.trim() === '') return;
        createTask({ columnId: colId, title: taskName });
        setTaskName(undefined);
        handleOpenTaskForm();
    };

    return (
        <div className="h-fit w-full border rounded-md p-4 hover:shadow-md transition-shadow duration-200 flex flex-col gap-6">
            <div className="grid grid-cols-5 w-full">
                <div className="col-span-5 flex flex-col gap-1 cursor-pointer">
                    <Textarea
                        className='w-full p-0 border-none shadow-none focus-visible:outline-none 
                        focus-visible:ring-0 focus-visible:border-none resize-none'
                        autoFocus
                        onChange={(e) => setTaskName(e.target.value)}
                        aria-expanded={false}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleCreateTask();
                            }
                        }}
                        onBlur={() => {
                            handleOpenTaskForm();
                        }}
                    />
                    <div className='w-full flex justify-end'>
                        <span className='p-1 bg-gray-100 rounded-xs flex items-center text-xs font-semibold text-gray-700'>
                            Enter 
                            <p className='text-md ml-1'>⏎</p>
                        </span>
                    </div>
                </div>
                {/* <span className='text-sm font-semibold text-gray-700 flex items-center justify-start'>
                    Enter ⏎
                </span> */}
            </div>
        </div>
    )
}