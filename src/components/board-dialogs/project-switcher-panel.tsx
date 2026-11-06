'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Building2,
  ChevronRight,
  Plus,
  Settings2,
  UserPlus,
} from 'lucide-react';
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
import { useOpenTask } from '@/components/task-detail/use-open-task';
import { SearchScopeBar, type SearchScope } from './parts/search-scope';
import { SwitcherTaskResults } from './parts/switcher-task-results';
import { useTaskSearch } from './use-task-search';
import {
  filterSwitcherActions,
  orderBoardsForSwitcher,
  splitArchivedBoards,
} from '@/helper/utils/board-switcher';
import { cn } from '@/lib/utils';
import { canCreateBoards } from '@/lib/rbac/workspace-permissions';
import { useBoardAccess } from '@/components/project/use-board-access';
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
  const router = useRouter();
  const { data: session } = useSession();
  const access = useBoardAccess();
  const hasWorkspace = Boolean(session?.user?.organizationId);

  const [query, setQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [scope, setScope] = useState<SearchScope>('all');
  const search = useTaskSearch(query, scope === 'here' ? projectIsUsing : null);
  const openTask = useOpenTask();
  // when results arrive, the best task is the one Enter opens
  const [highlighted, setHighlighted] = useState('');
  const [seenHits, setSeenHits] = useState(search.hits);
  if (search.hits !== seenHits) {
    setSeenHits(search.hits);
    if (search.hits[0]) setHighlighted(`task-${search.hits[0].taskId}`);
  }

  // เปิดใหม่ทุกครั้งเริ่มค้นจากช่องว่าง (adjust-state-on-prop-change ไม่ใช้ effect)
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setQuery('');
      setShowArchived(false);
      setScope('all');
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
  // offer only what the server will allow
  const createAction = canCreateBoards(session?.user?.orgRole)
    ? [
        {
          id: 'create',
          icon: Plus,
          label: 'Create new board',
          dashed: true,
          run: () => setBoardDialog('create'),
        },
      ]
    : !hasWorkspace
      ? [
          {
            id: 'workspace',
            icon: Building2,
            label: 'Create your own workspace',
            dashed: true,
            run: () => {
              onClose();
              router.push('/organization/create');
            },
          },
        ]
      : [];
  const actions = filterSwitcherActions(
    [
      ...createAction,
      ...(current
        ? [
            {
              id: 'settings',
              icon: Settings2,
              label: 'Board settings',
              hint: current.name,
              run: () => openBoardSettings('general'),
            },
            ...(access.can('member:invite')
              ? [
                  {
                    id: 'invite',
                    icon: UserPlus,
                    label: 'Invite members',
                    run: () => openBoardSettings('members'),
                  },
                ]
              : []),
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
      commandProps={{
        shouldFilter: false,
        loop: true,
        value: highlighted,
        onValueChange: setHighlighted,
      }}
    >
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Search boards and tasks, or type a command"
        aria-label="Search boards and tasks"
        trailing={<Kbd>esc</Kbd>}
      />
      {search.active && (
        <SearchScopeBar
          scope={scope}
          onScope={setScope}
          canSearchHere={Boolean(projectIsUsing)}
        />
      )}
      <CommandList>
        {search.active && (
          <>
            <SwitcherTaskResults
              hits={search.hits}
              query={query}
              searching={search.searching}
              onSelect={(hit) => {
                onClose();
                void openTask(hit.taskId);
              }}
            />
            {boards.length > 0 && <CommandSeparator alwaysRender />}
          </>
        )}
        {boards.length === 0 && query.trim() ? (
          // task results already say what matched
          !search.active && (
            <p className="px-3 py-7 text-center text-sm leading-5 text-ink-subtle">
              No boards match “{query.trim()}”
            </p>
          )
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
