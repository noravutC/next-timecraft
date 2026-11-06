'use client';

import type { ComponentProps } from 'react';
import { Link, X } from 'lucide-react';
import { SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ProjectAvatar } from '@/components/project/project-avatar';
import { BreadcrumbSlash } from '@/components/breadcrumb/breadcrumb-slash';
import type { ColumnCache } from '@/types';
import { StatusPicker } from './status-picker';

interface TaskSheetHeaderProps {
  project: ComponentProps<typeof ProjectAvatar>['project'] | null;
  columns: ColumnCache[];
  activeColumnId: string;
  onStatusChange: (columnId: string) => void;
  onCopyLink: () => void;
}

/** Board / status breadcrumb, copy link and close. */
export const TaskSheetHeader = ({
  project,
  columns,
  activeColumnId,
  onStatusChange,
  onCopyLink,
}: TaskSheetHeaderProps) => (
  <header className="flex h-13 shrink-0 items-center gap-2 border-b border-line pr-2.5 pl-5">
    {project && (
      <>
        <ProjectAvatar
          project={project}
          size="size-4.5"
          rounded="rounded-sm"
          textSize="text-3xs"
        />
        <span className="min-w-0 truncate text-sm text-ink-muted">
          {project.name}
        </span>
        <BreadcrumbSlash className="size-4" />
      </>
    )}
    <StatusPicker
      variant="pill"
      columns={columns}
      activeColumnId={activeColumnId}
      onChange={onStatusChange}
    />
    <div className="flex-1" />
    <Button
      variant="ghost"
      size="icon"
      onClick={onCopyLink}
      aria-label="Copy link to task"
    >
      <Link />
    </Button>
    <SheetClose asChild>
      <Button variant="ghost" size="icon" aria-label="Close">
        <X />
      </Button>
    </SheetClose>
  </header>
);
