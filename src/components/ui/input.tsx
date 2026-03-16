import * as React from "react";

import { cn } from "@/lib/utils";
interface InputProps extends React.ComponentProps<"input"> {
  inputSize?: "sm" | "md" | "lg" | "default";
}
function Input({ inputSize = "sm", className, type, ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "transition-all duration-200 focus-visible:border-none focus-visible:ring-2 focus-visible:ring-blue-500",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        inputSize === "sm" && "h-8 px-2 py-1",
        inputSize === "md" && "h-9 px-3 py-1",
        inputSize === "lg" && "h-10 px-4 py-2",
        inputSize === "default" && "h-9 px-3 py-1",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
