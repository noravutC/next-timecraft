"use client"

import * as React from "react"
import { CheckIcon, ChevronsUpDownIcon, ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { useState } from "react"

interface ProjectSelectorProps<T> {
    options: T[];
    optionKeys: {
        value: keyof T;
        label: keyof T;
        description?: keyof T;
        avatar?: keyof T;
    };
    value: string | null;
    onChange: (option: string) => void;
    placeholder: string;
    placeholderKeyword: string;
    isLoading?: boolean;
    disabled?: boolean;
}
export const ProjectSelector = <T,>({
    options,
    optionKeys,
    value: selectedValue,
    onChange,
    placeholder,
    placeholderKeyword,
    isLoading,
    disabled
}: ProjectSelectorProps<T>) => {
    const [open, setOpen] = useState(false)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between cursor-pointer h-fit p-3"
                >
                    {selectedValue
                        ? <p className="text-sm font-normal">
                            {String(options.find((o) => o[optionKeys.value] === selectedValue)?.[optionKeys.label] ?? "not found")}
                        </p>
                        : <p>{placeholder}</p>}

                    <ChevronDownIcon className="ml-2 size-4 min-w-4 max-w-4 min-h-4 min-w-5 shrink-0 opacity-50" strokeWidth={2.5} />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full min-w-[var(--radix-popover-trigger-width)] maxw-[var(--radix-popover-trigger-width)] p-0">
                <Command>
                    <CommandInput placeholder={`Search ${placeholderKeyword}...`} />
                    <CommandList className="scrollbar-thin-y">
                        <CommandEmpty>No {placeholderKeyword} found.</CommandEmpty>
                        <CommandGroup >
                            {options.map((o) => (
                                <CommandItem
                                    key={o[optionKeys.value] as React.Key}
                                    value={o[optionKeys.label] as string}
                                    className={cn("cursor-pointer h-fit p-3",
                                        selectedValue === o[optionKeys.value] as string ? 'bg-blue-100' : ''
                                    )}
                                    onSelect={() => {
                                        onChange(o[optionKeys.value] as string)
                                        setOpen(false)
                                    }}
                                >
                                    {o[optionKeys.label] as string}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}