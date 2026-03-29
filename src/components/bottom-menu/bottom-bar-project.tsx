'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavStore, useProjectStore, viewMeta } from '@/store';
import { LucideIcon, Plus } from 'lucide-react';
import { DropdownMenuSwitchProject } from './dropdown-menu-switch-project';

export const BottomBarProject = () => {
  const { setNeedCreateProject } = useProjectStore();
  const { view, setView } = useNavStore();

  const tabs = (['board', 'settings'] as const).map((k) => ({
    key: k,
    ...viewMeta[k],
  }));

  return (
    <div className="absolute right-0 bottom-4 left-0 z-50 mx-auto flex h-11 w-fit min-w-100 items-center gap-0.5 rounded-md border border-gray-200 bg-background p-1 shadow-sm">
      {/* Tab items: Board, Settings */}
      {tabs.map((tab) => (
        <MenuBottomNav
          key={tab.key}
          label={tab.label}
          Icon={tab.icon}
          iconClass={tab.iconClass}
          isActive={view === tab.key}
          onSetView={() => setView(tab.key)}
        />
      ))}

      {/* Separator */}
      <div className="mx-1 h-5 w-px shrink-0 bg-gray-200" />

      {/* Switch Boards Dropdown */}
      <DropdownMenuSwitchProject />

      {/* New / Add Dropdown */}
      <Button size="sm" className="h-full rounded-md px-2.5" onClick={() => setNeedCreateProject(true)}>
        <Plus className="size-4" />
      </Button>
    </div>
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
        'relative h-full w-full max-w-30 min-w-20 cursor-pointer overflow-hidden rounded-md text-muted-foreground duration-200 select-none',
        'hover:bg-foreground/10 hover:text-foreground/80',
        isActive &&
          'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary',
      )}
    >
      <span className="flex h-full w-full items-center justify-center gap-1.5 px-3 text-sm font-semibold">
        {Icon ? <Icon className={cn('shrink-0', iconClass)} /> : null}
        {label}
      </span>
      {isActive && (
        <div className="absolute right-0 bottom-0 left-0 mx-auto h-[3px] w-6 rounded-t-md bg-primary" />
      )}
    </div>
  );
};
