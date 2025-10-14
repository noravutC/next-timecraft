"use client"

import * as React from "react"
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react"

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
    placeholderHead: string;
    isLoading?: boolean;
    disabled?: boolean;
}
export const ProjectSelector = <T,>({
    options,
    optionKeys,
    value: selectedValue,
    onChange,
    placeholder,
    placeholderHead,
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
                    className="w-fit justify-between"
                >
                    {selectedValue
                        ? String(options.find((o) => o[optionKeys.value] === selectedValue)?.[optionKeys.label] ?? "no found")
                        : placeholder}
                    <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
                <Command>
                    <CommandInput placeholder={`Search ${placeholderHead}...`} />
                    <CommandList>
                        <CommandEmpty>No {placeholderHead} found.</CommandEmpty>
                        <CommandGroup>
                            {options.map((o) => (
                                <CommandItem
                                    key={o[optionKeys.value] as React.Key}
                                    value={o[optionKeys.label] as string}
                                    onSelect={() => {
                                        onChange(o[optionKeys.value] as string)
                                        setOpen(false)
                                    }}
                                >
                                    <CheckIcon
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            selectedValue === o[optionKeys.value] as string ? "opacity-100" : "opacity-0"
                                        )}
                                    />
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