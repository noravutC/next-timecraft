'use client';

import { AiBreakdown } from './_components/ai-breakdown';
import { BoardFilterBar } from './_components/board-filter-bar';
import { Column } from './_components/column';
import { useBoard } from './_components/use-board';

export default function ProjectPage() {
  const { scrollableRef, board, panCursor, settings } = useBoard();

  const boardCls = settings.isBoardMoreObvious ? 'px-32 py-20' : '';
  const scrollCls = `flex h-full flex-row items-start gap-4.5 overflow-x-auto p-5 scrollbar-thin-x scrollbar-light ${settings.isBoardMoreObvious ? 'rounded border-2 border-dashed' : ''}`;

  return (
    <div className={`relative flex h-full flex-col bg-surface ${boardCls}`}>
      <BoardFilterBar />
      <div
        ref={scrollableRef}
        className={scrollCls}
        style={{ cursor: panCursor !== 'default' ? panCursor : undefined }}
      >
        {board.columns.map((column) => (
          <Column key={column.id} column={column} allColumns={board.columns} />
        ))}
      </div>
      <AiBreakdown columns={board.columns} />
    </div>
  );
}
