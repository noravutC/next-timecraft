'use client';

export type GhostAt = {
  activeId: string;
  columnId: string;
  index: number;
};


interface BoardDndProps {
  projectId: string;
}

export const BoardDnd = ({ projectId }: BoardDndProps) => {

  return (
    <div
      className="flex max-w-full h-full gap-4 items-start justify-start overflow-y-hidden overflow-x-auto scrollbar-thin-x"
    >

    </div>
  );
};
