import React, { useMemo } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { hexToRgba } from '@/helper/utils';
import { cn } from '@/lib/utils';
import { useColumnStore } from '@/store/use-column.store';
import { useProjectStore } from '@/store/use-project.store';

interface BarColumnProps {
  taskAtColumnId: string;
  taskId: string;
}

const byOrderFraction = (
  a: { orderFraction?: string | null },
  b: { orderFraction?: string | null },
) => (a.orderFraction ?? '').localeCompare(b.orderFraction ?? '');

export const BarColumn = React.memo(function BarColumn({ taskAtColumnId }: BarColumnProps) {
  const columns = useColumnStore((state) => state.columns);
  const projectId = useProjectStore((state) => state.projectIsUsing);

  const sortedCols = useMemo(
    () =>
      Object.values(columns)
        .filter((column) => !projectId || column.projectId === projectId)
        .sort(byOrderFraction)
        .map((column) => ({
          id: column.id,
          name: column.name,
          color: column.color,
          orderFraction: column.orderFraction,
        })),
    [columns, projectId],
  );

  const activeIndex = sortedCols.findIndex((column) => column.id === taskAtColumnId);
  if (activeIndex === -1 || sortedCols.length === 0) return null;

  const activeColumn = sortedCols[activeIndex];
  const targetOpacity = 0.75;
  const backgroundStyle = activeColumn.color
    ? { background: hexToRgba(activeColumn.color, targetOpacity) }
    : {};

  return (
    <div
      className={cn('w-full max-h-3.5 h-3.5 border bg-gray-100 rounded-full overflow-hidden grid')}
      style={{ gridTemplateColumns: `repeat(${sortedCols.length}, minmax(0, 1fr))` }}
    >
      {sortedCols.map((column, index) => {
        const isLast = index === sortedCols.length - 1;
        const isHighlight = index <= activeIndex;

        return (
          <Tooltip key={column.id}>
            <TooltipTrigger asChild className="cursor-pointer">
              <div
                className={cn(
                  'h-full w-full overflow-hidden transition-colors duration-200',
                  !isLast && 'border-r border-gray-300',
                )}
                style={isHighlight ? backgroundStyle : undefined}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>{column.name}</p>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
});
