'use client';

import { ArchivedBoardBanner } from './_components/archived-board-banner';
import { BoardFilterBar } from './_components/board-filter-bar';
import { Column } from './_components/column';
import { useBoard } from './_components/use-board';

export default function ProjectPage() {
  const { scrollableRef, board, panCursor, settings } = useBoard();

  const boardCls = settings.isBoardMoreObvious ? 'px-32 py-20' : '';
  const scrollCls = `flex min-h-0 flex-1 flex-row items-start gap-3 overflow-x-auto px-5 pt-4 pb-5 scrollbar-thin-x scrollbar-light ${settings.isBoardMoreObvious ? 'rounded border-2 border-dashed' : ''}`;

  return (
    <div className={`relative flex h-full flex-col bg-background ${boardCls}`}>
      <BoardFilterBar columns={board.columns} />
      <ArchivedBoardBanner />
      <div
        ref={scrollableRef}
        className={scrollCls}
        style={{ cursor: panCursor !== 'default' ? panCursor : undefined }}
      >
        {board.columns.map((column) => (
          <Column key={column.id} column={column} allColumns={board.columns} />
        ))}
      </div>
    </div>
  );
}
