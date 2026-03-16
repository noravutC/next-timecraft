import React, { useMemo } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { hexToRgba } from '@/helper/utils';
import { cn } from '@/lib/utils';
import { useColumnStore } from '@/store/use-column.store';
import { useProjectStore } from '@/store/use-project.store';

export const BarColumn = React.memo(function BarColumn({
  taskAtColumnId,
}: {
  taskAtColumnId: string;
}) {
  const columns = useColumnStore((s) => s.columns);
  const projectId = useProjectStore((s) => s.projectIsUsing);

  const sortedCols = useMemo(
    () =>
      Object.values(columns)
        .filter((col) => !projectId || col.projectId === projectId)
        .sort((a, b) => {
          const av = a.orderFraction ?? '';
          const bv = b.orderFraction ?? '';
          return av < bv ? -1 : av > bv ? 1 : 0;
        })
        .map(({ id, name, color, orderFraction }) => ({
          id,
          name,
          color,
          orderFraction,
        })),
    [columns, projectId],
  );

  const activeIndex = sortedCols.findIndex((col) => col.id === taskAtColumnId);
  if (activeIndex === -1 || sortedCols.length === 0) return null;

  const backgroundStyle = sortedCols[activeIndex].color
    ? { background: hexToRgba(sortedCols[activeIndex].color!, 0.75) }
    : {};

  return (
    <div
      className={cn(
        'w-full max-h-3.5 h-3.5 border bg-gray-100 rounded-full overflow-hidden grid',
      )}
      style={{
        gridTemplateColumns: `repeat(${sortedCols.length}, minmax(0, 1fr))`,
      }}
    >
      {sortedCols.map((col, index) => (
        <Tooltip key={col.id}>
          <TooltipTrigger asChild className="cursor-pointer">
            <div
              className={cn(
                'h-full w-full overflow-hidden transition-colors duration-200',
                index < sortedCols.length - 1 && 'border-r border-gray-300',
              )}
              style={index <= activeIndex ? backgroundStyle : undefined}
            />
          </TooltipTrigger>
          <TooltipContent>
            <p>{col.name}</p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
});
