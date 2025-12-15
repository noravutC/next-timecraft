'use client';

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover" // <- Used here
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"
import React, { useEffect, useMemo, useState } from "react"
import { useBoardStore, useProjectStore } from "@/hooks";
import { ColumnCache } from "@/types";
import { ChevronDownIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { hexToRgba } from "@/helper/utils";

interface ColumnSelectorProps extends React.ComponentPropsWithRef<typeof Popover> {
    column: ColumnCache;
}
export const ColumnSelector = ({
    column,
    ...props
}: ColumnSelectorProps) => {
    const { projectIdActivate } = useProjectStore();
    const { columns } = useBoardStore();
    const [selectedValue, setSelectedValue] = useState<string | undefined>(undefined);

    const options = Object.values(columns).filter((c) => c.projectId === projectIdActivate && c._id !== column._id);
    const columnValuesIsSelected = useMemo(() => {
        return selectedValue ? columns[selectedValue] : undefined;
    }, [selectedValue]);

    const targetOpacity = 0.6;
    const backgroundStyle = columnValuesIsSelected?.color
        ? { background: hexToRgba(columnValuesIsSelected.color, targetOpacity) }
        : {};

    useEffect(() => {
        if (options.length > 0) {
            setSelectedValue(options[0]._id);
        }
    }, [options]);

    return (
        <Popover {...props}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className="w-full min-w-50 justify-between cursor-pointer p-2"
                >
                    {columnValuesIsSelected ? (
                        <Badge style={backgroundStyle} className="text-gray-800">{columnValuesIsSelected.name}</Badge>
                    ) : (
                        <p className="text-sm font-normal text-gray-500">Selected destination column</p>
                    )}
                    <ChevronDownIcon className="ml-2 size-4 min-w-4 max-w-4 min-h-4 min-w-5 shrink-0 opacity-50" strokeWidth={2.5} />
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-full min-w-[var(--radix-popover-trigger-width)] max-w-[var(--radix-popover-trigger-width)] p-0">
                <Command>
                    <CommandInput placeholder={`Search column...`} />
                    <CommandList className="scrollbar-thin-y">
                        <CommandEmpty>No column found.</CommandEmpty>
                        <CommandGroup >
                            {options.map((o) => {
                                const bgOptionStyle = o.color
                                    ? { background: hexToRgba(o.color, targetOpacity) }
                                    : {};
                                return (
                                    <CommandItem
                                        key={o._id}
                                        value={`${o._id} ${o.name}`}
                                        className={cn("cursor-pointer h-fit p-3",
                                            selectedValue === o._id ? 'bg-blue-50' : ''
                                        )}
                                        onSelect={() => setSelectedValue(o._id)}
                                    >
                                        <Badge style={bgOptionStyle} className="text-gray-800">{o.name}</Badge>
                                        {/* <div className="flex items-center justify-start gap-2">
                                            <div className="bg-black h-5 rounded-full w-2 opacity-60"
                                                style={{
                                                    background: o.color,
                                                }}
                                            ></div>
                                            <p>{o.name}</p>
                                        </div> */}
                                    </CommandItem>
                                )
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};
