'use client';

import React, { useState } from 'react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from '@/components/ui/badge';
import { Sketch } from '@uiw/react-color';

interface ColorPickerProps {
    defaultColor?: string;
    onChange: (color: string) => void;
}

export const ColorPicker = ({
    defaultColor,
    onChange,
}: ColorPickerProps) => {
    const [open, setOpen] = useState(false);
    const [hex, setHex] = useState(defaultColor ?? "#55c6dcff");
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div className='w-full h-8 rounded border border-gray-300 cursor-pointer'
                    style={{
                        background: hex,
                    }}
                />
                {/* <Badge className='w-20 h-10 rounded-sm'></Badge> */}
            </PopoverTrigger>
            <PopoverContent
                side='right' align='start'
                className="w-fit h-fit p-0"

            >
                <Sketch
                    width={250}
                    color={hex}
                    onChange={(color) => {
                        setHex(color.hex);
                        onChange(color.hex);
                    }}
                />
            </PopoverContent>
        </Popover>
    )
}