'use client';

import React, { useMemo } from "react";
import { type UniqueIdentifier } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";

interface StableSortableContextProps {
  items: UniqueIdentifier[];
  children: React.ReactNode;
}

export const StableSortableContext = React.memo(function StableSortableContext({
  items,
  children,
}: StableSortableContextProps) {
  // Memoize the `items` array so the context doesn't re-render unless they change
  const memoizedItems = useMemo(() => items, [items.join(",")]);

  return <SortableContext items={memoizedItems}>{children}</SortableContext>;
});
