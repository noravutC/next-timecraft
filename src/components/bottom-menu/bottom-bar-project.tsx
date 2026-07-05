'use client';

import { useState } from 'react';
import { Layers, LucideIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavStore, useProjectStore, viewMeta } from '@/store';
import { ProjectSwitcherPanel } from './project-switcher-panel';

export const BottomBarProject = () => {
  const { setNeedCreateProject } = useProjectStore();
  const { view, setView } = useNavStore();
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const tabs = (['board', 'settings'] as const).map((k) => ({
    key: k,
    ...viewMeta[k],
  }));

  return (
    <>
      <ProjectSwitcherPanel
        open={switcherOpen}
        onClose={() => setSwitcherOpen(false)}
      />

      <div className="absolute right-0 bottom-5.5 left-0 z-50 mx-auto flex h-13 w-fit min-w-100 items-center gap-1 rounded-2xl border border-[#ECEDF1] bg-background p-1.5 shadow-[0_10px_34px_rgba(20,22,35,0.13)]">
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

        {/* Switch Boards toggle */}
        <div
          onClick={() => setSwitcherOpen((v) => !v)}
          aria-pressed={switcherOpen}
          className={cn(
            'relative h-full w-full max-w-35 min-w-max cursor-pointer overflow-hidden rounded-xl text-[#7C808C] duration-200 select-none',
            'hover:bg-[#F4F4F7] hover:text-[#15161D]',
            switcherOpen && 'bg-[#F4F4F7] text-[#15161D]',
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
          className="h-full rounded-xl bg-[#5B50E6] px-2.5 shadow-[0_3px_10px_rgba(91,80,230,0.35)] hover:bg-[#4A40D6]"
          onClick={() => setNeedCreateProject(true)}
        >
          <Plus className="size-4" />
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
        'relative h-full w-full max-w-30 min-w-20 cursor-pointer overflow-hidden rounded-xl text-[#7C808C] duration-200 select-none',
        'hover:bg-[#F4F4F7] hover:text-[#15161D]',
        isActive && 'bg-[#EEEDFC] text-[#5B50E6] hover:bg-[#EEEDFC] hover:text-[#5B50E6]',
      )}
    >
      <span className="flex h-full w-full items-center justify-center gap-1.5 px-3.5 text-sm font-bold">
        {Icon ? <Icon className={cn('shrink-0', iconClass)} /> : null}
        {label}
      </span>
    </div>
  );
};
