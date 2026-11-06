'use client';

import { useState } from 'react';
import { ChevronRight, Plus, Settings2, UserPlus } from 'lucide-react';
import { useNavStore, useProjectStore } from '@/store';
import {
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Kbd } from '@/components/ui/kbd';
import { useWorkspaceName } from '@/components/workspace/use-workspace-name';
import {
  filterSwitcherActions,
  orderBoardsForSwitcher,
  splitArchivedBoards,
} from '@/helper/utils/board-switcher';
import { cn } from '@/lib/utils';
import { SwitcherBoardItem } from './parts/switcher-board-item';
import { SwitcherActionItem } from './parts/switcher-action-item';
import { SwitcherFooter } from './parts/switcher-footer';

interface ProjectSwitcherPanelProps {
  open: boolean;
  onClose: () => void;
}

/** ⌘K palette: jump to a board, or create / configure / invite. */
export const ProjectSwitcherPanel = ({
  open,
  onClose,
}: ProjectSwitcherPanelProps) => {
  const projects = useProjectStore((s) => s.projects);
  const projectIsUsing = useProjectStore((s) => s.projectIsUsing);
  const setProjectIsUsing = useProjectStore((s) => s.setProjectIsUsing);
  const setBoardDialog = useNavStore((s) => s.setBoardDialog);
  const openBoardSettings = useNavStore((s) => s.openBoardSettings);
  const workspaceName = useWorkspaceName();

  const [query, setQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  // เปิดใหม่ทุกครั้งเริ่มค้นจากช่องว่าง (adjust-state-on-prop-change ไม่ใช้ effect)
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setQuery('');
      setShowArchived(false);
    }
  }

  const current = projectIsUsing ? projects[projectIsUsing] : null;
  const boards = orderBoardsForSwitcher(
    Object.values(projects),
    projectIsUsing,
    query,
  );
  const { active, archived } = splitArchivedBoards(boards);
  // a search reaches into the archive; otherwise it stays folded
  const archivedOpen = showArchived || Boolean(query.trim());
  const selectBoard = (id: string) => {
    setProjectIsUsing(id);
    onClose();
  };
  const actions = filterSwitcherActions(
    [
      {
        id: 'create',
        icon: Plus,
        label: 'Create new board',
        dashed: true,
        run: () => setBoardDialog('create'),
      },
      ...(current
        ? [
            {
              id: 'settings',
              icon: Settings2,
              label: 'Board settings',
              hint: current.name,
              run: () => openBoardSettings('general'),
            },
            {
              id: 'invite',
              icon: UserPlus,
              label: 'Invite members',
              run: () => openBoardSettings('members'),
            },
          ]
        : []),
    ],
    query,
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title="Switch boards"
      description="Search boards or run a board action"
      commandProps={{ shouldFilter: false, loop: true }}
    >
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Search boards or type a command"
        aria-label="Search boards"
        trailing={<Kbd>esc</Kbd>}
      />
      <CommandList>
        {boards.length === 0 && query.trim() ? (
          <p className="px-3 py-7 text-center text-sm leading-5 text-ink-subtle">
            No boards match “{query.trim()}”
          </p>
        ) : (
          <CommandGroup
            heading={workspaceName ? `Boards in ${workspaceName}` : 'Boards'}
          >
            {active.map((project) => (
              <SwitcherBoardItem
                key={project.id}
                project={project}
                isCurrent={project.id === projectIsUsing}
                onSelect={() => selectBoard(project.id)}
              />
            ))}
            {archived.length > 0 && (
              <CommandItem
                value="archived-boards"
                onSelect={() => setShowArchived((v) => !v)}
                aria-expanded={archivedOpen}
                className="h-9 text-ink-muted"
              >
                <ChevronRight
                  className={cn(
                    'size-3.5 transition-transform',
                    archivedOpen && 'rotate-90',
                  )}
                />
                Archived boards
                <span className="font-mono text-xs text-ink-subtle">
                  {archived.length}
                </span>
              </CommandItem>
            )}
            {archivedOpen &&
              archived.map((project) => (
                <SwitcherBoardItem
                  key={project.id}
                  project={project}
                  isCurrent={project.id === projectIsUsing}
                  onSelect={() => selectBoard(project.id)}
                  className="pl-8"
                />
              ))}
          </CommandGroup>
        )}
        <CommandSeparator alwaysRender />
        <CommandGroup heading="Actions">
          {actions.map(({ run, ...action }) => (
            <SwitcherActionItem key={action.id} {...action} onSelect={run} />
          ))}
        </CommandGroup>
      </CommandList>
      <SwitcherFooter />
    </CommandDialog>
  );
};
