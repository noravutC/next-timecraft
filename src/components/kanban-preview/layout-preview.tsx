"use client";

import { ScrollArea, ScrollBar } from "../ui/scroll-area";

// Don't used yet
export const LayoutPreview = ({ children }: { children: React.ReactNode }) => {
  return (
    <ScrollArea className="w-full !h-max h-full whitespace-nowrap overflow-hidden pb-4">
      <div className="flex w-full h-full items-end gap-4 pr-4">{children}</div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};
