"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ComboboxProps<T> {
  data: T[];
  optionKeys: {
    label: keyof T;
    value: keyof T;
    description?: keyof T;
  };
  placeholder: string;
  placeholderEmpty: string;
  placeholderSearch: string;
  value: string | null | undefined;
  setValue: (value: string) => void;
  classNameShowUp?: string;
  classNamePopOver?: string;
}
// Don't used yet
export const Combobox = <T,>({
  data,
  optionKeys,
  placeholder,
  placeholderEmpty,
  placeholderSearch,
  value,
  setValue,
  classNameShowUp,
  classNamePopOver,
}: ComboboxProps<T>) => {
  const [open, setOpen] = React.useState(false);
  // const [value, setValue] = React.useState("")

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-[200px] justify-between text-sm font-normal",
            classNameShowUp,
          )}
        >
          {value ? (
            (data.find((item) => item[optionKeys.value] === value)?.[
              optionKeys.label
            ] as string)
          ) : (
            <span className="text-sm text-gray-500">{placeholder}</span>
          )}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-[200px] p-0", classNamePopOver)}>
        <Command>
          <CommandInput placeholder={placeholderSearch} className="h-9" />
          <CommandList>
            <CommandEmpty>{placeholderEmpty}</CommandEmpty>
            <CommandGroup>
              {data.map((item) => (
                <CommandItem
                  key={item[optionKeys.value] as string}
                  value={`${item[optionKeys.label]} ${optionKeys.description ? item[optionKeys.description] : ""}`}
                  onSelect={() => {
                    setValue(
                      item[optionKeys.value] === value
                        ? ""
                        : String(item[optionKeys.value]),
                    );
                    setOpen(false);
                  }}
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-sm flex-wrap">
                      {item[optionKeys.label] as string}
                    </span>
                    {optionKeys.description && (
                      <span className="text-xs text-gray-500 flex-wrap">
                        {item[optionKeys.description] as string}
                      </span>
                    )}
                  </div>

                  <Check
                    className={cn(
                      "ml-auto",
                      value === item[optionKeys.value]
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
