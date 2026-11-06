'use client';

import { AppHeader } from '@/components/app-header/app-header';
import { useWorkspace } from '@/components/workspace/use-workspace-name';
import { SettingsNav } from './_components/settings-nav';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const workspace = useWorkspace();

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-background">
      <AppHeader workspace={workspace} current="Settings" />
      <div className="mx-auto flex w-full max-w-270 flex-col gap-8 px-6 pt-10 pb-16 md:flex-row md:items-start md:gap-12">
        <SettingsNav />
        <main className="flex max-w-170 min-w-0 flex-1 flex-col gap-7">
          {children}
        </main>
      </div>
    </div>
  );
}
