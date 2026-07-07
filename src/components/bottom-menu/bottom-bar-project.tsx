'use client';

import { Layers, LucideIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavStore, viewMeta } from '@/store';
import { ProjectSwitcherPanel } from './project-switcher-panel';
import { CreateBoardDialog } from './create-board-dialog';
import { BoardSettingsDialog } from './board-settings-dialog';

export const BottomBarProject = () => {
  const { view, setView, boardDialog, setBoardDialog } = useNavStore();

  const tabs = (['board', 'settings'] as const).map((k) => ({
    key: k,
    ...viewMeta[k],
  }));

  return (
    <>
      <ProjectSwitcherPanel
        open={boardDialog === 'switch'}
        onClose={() => setBoardDialog(null)}
        onCreateNew={() => setBoardDialog('create')}
      />
      <CreateBoardDialog
        open={boardDialog === 'create'}
        onClose={() => setBoardDialog(null)}
      />
      <BoardSettingsDialog
        open={boardDialog === 'settings'}
        onClose={() => setBoardDialog(null)}
      />

      <div className="absolute right-0 bottom-5.5 left-0 z-50 mx-auto flex h-13 w-fit min-w-100 items-center gap-1 rounded-2xl border border-line bg-background p-1.5 shadow-[0_10px_34px_rgba(20,22,35,0.13)]">
        {/* Tab items: Board = view สลับหน้า, Settings = เปิด dialog */}
        {tabs.map((tab) => (
          <MenuBottomNav
            key={tab.key}
            label={tab.label}
            Icon={tab.icon}
            iconClass={tab.iconClass}
            isActive={
              tab.key === 'settings'
                ? boardDialog === 'settings'
                : view === tab.key
            }
            onSetView={() =>
              tab.key === 'settings'
                ? setBoardDialog('settings')
                : setView(tab.key)
            }
          />
        ))}

        {/* Switch Boards toggle */}
        <div
          onClick={() =>
            setBoardDialog(boardDialog === 'switch' ? null : 'switch')
          }
          aria-pressed={boardDialog === 'switch'}
          className={cn(
            'relative h-full w-full max-w-35 min-w-max cursor-pointer overflow-hidden rounded-xl text-ink-subtle duration-200 select-none',
            'hover:bg-surface-hover hover:text-ink',
            boardDialog === 'switch' && 'bg-surface-hover text-ink',
          )}
        >
          <span className="flex h-full w-full items-center justify-center gap-1.5 px-3.5 text-sm font-semibold">
            <Layers className="size-3.5 shrink-0" />
            Switch Boards
          </span>
        </div>

        {/* New / Add */}
        <Button
          size="sm"
          className="h-full rounded-xl bg-brand !px-2.5 shadow-[0_3px_10px_rgba(91,80,230,0.35)] hover:bg-brand-dark"
          onClick={() => setBoardDialog('create')}
        >
          <Plus className="size-4" strokeWidth={2.5} />
        </Button>
      </div>
    </>
  );
};

export const MenuBottomNav = ({
  label,
  Icon,
  iconClass,
  isActive,
  onSetView,
}: {
  label: string;
  Icon?: LucideIcon;
  iconClass?: string;
  isActive: boolean;
  onSetView: () => void;
}) => {
  return (
    <div
      onClick={onSetView}
      className={cn(
        'relative h-full w-full max-w-30 min-w-20 cursor-pointer overflow-hidden rounded-xl text-ink-subtle duration-200 select-none',
        'hover:bg-surface-hover hover:text-ink',
        isActive && 'bg-brand-soft text-brand hover:bg-brand-soft hover:text-brand',
      )}
    >
      <span className="flex h-full w-full items-center justify-center gap-1.5 px-3.5 text-sm font-bold">
        {Icon ? <Icon className={cn('shrink-0', iconClass)} /> : null}
        {label}
      </span>
    </div>
  );
};
