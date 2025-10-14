"use client";

import * as React from "react";
import { Check, ChevronsUpDown, ChevronDown } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type RoleOption = {
  id: string;
  name: string;
  description?: string;
};

const roles: RoleOption[] = [
  { id: "1", name: "Admin", description: "Manage all accesses in project" },
  { id: "2", name: "Member", description: "Manage tasks in project" },
  { id: "3", name: "Viewer", description: "View project data only" },
];

interface SelectorProps {
  value: string;
  onChange: (val: string) => void;
}

export const Selector: React.FC<SelectorProps> = ({ value, onChange }) => {
  const [open, setOpen] = React.useState(false);

  const selectedRole = roles.find((r) => r.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Badge
          className={cn(
            "w-[90px] flex items-center justify-center rounded-full border p-1 px-2 shadow-sm",
            "text-xs cursor-pointer bg-blue-600"
          )}
        >
          {selectedRole ? selectedRole.name : "Select role"}

          <ChevronDown strokeWidth={3}  />
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="max-w-[90px] p-0">
        <Command>
          {/* <CommandInput placeholder="Search role..." /> */}
          <CommandList>
            <CommandEmpty>No role found.</CommandEmpty>
            <CommandGroup>
              {roles.map((role) => (
                <CommandItem
                  key={role.id}
                  value={role.id}
                  onSelect={() => {
                    onChange(role.id);
                    setOpen(false);
                  }}
                  className="flex justify-between items-center text-xs"
                >
                  {role.name}
                  <Check
                    className={cn(
                      "mr-1 h-2 w-2",
                      value === role.id ? "opacity-100" : "opacity-0"
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
