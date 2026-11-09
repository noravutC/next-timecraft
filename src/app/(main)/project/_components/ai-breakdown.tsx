'use client';

import { Lock, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AiBreakdownGenerate } from './ai-breakdown-generate';
import { AiBreakdownSettings } from './ai-breakdown-settings';
import {
  useAiBreakdown,
  type BoardColumnLike,
  type TabKey,
} from './use-ai-breakdown';

export const AiBreakdown = ({ columns }: { columns: BoardColumnLike[] }) => {
  const ai = useAiBreakdown(columns);

  if (columns.length === 0 || !ai.targetColumn) return null;

  return (
    <Sheet
      open={ai.open}
      onOpenChange={(next) => !ai.isGenerating && ai.setOpen(next)}
    >
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          data-testid="ai-breakdown-trigger"
          className="border-line has-[>svg]:px-3"
        >
          <Sparkles className="size-3.75 text-brand" />
          <span className="sr-only lg:not-sr-only">AI Breakdown</span>
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        showCloseButton={false}
        className="sm:max-w-110"
      >
        <div className="flex shrink-0 items-start gap-3 pt-4.5 pr-3 pl-5">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
            <Sparkles className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <SheetTitle className="leading-5.5">AI Breakdown</SheetTitle>
            <SheetDescription className="mt-0.5 leading-5">
              Turn a goal into tasks with Claude or Gemini.
            </SheetDescription>
          </div>
          <SheetClose asChild>
            <Button variant="ghost" size="icon" aria-label="Close">
              <X className="size-4" />
            </Button>
          </SheetClose>
        </div>

        <Tabs
          value={ai.tab}
          onValueChange={(value) => ai.setTab(value as TabKey)}
          className="min-h-0 flex-1 gap-0"
        >
          <TabsList
            variant="underline"
            aria-label="AI Breakdown sections"
            className="mt-3.5 shrink-0 px-5"
          >
            <TabsTrigger value="generate">Generate</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent
            value="generate"
            className="scrollbar-thin-y scrollbar-light min-h-0 overflow-y-auto p-5"
          >
            <AiBreakdownGenerate
              columns={columns}
              target={ai.targetColumn}
              onTargetChange={ai.setColumnId}
              goal={ai.goal}
              onGoalChange={ai.setGoal}
              provider={ai.provider}
              onProviderChange={ai.switchProvider}
              modelLocked={ai.isGuest}
              settingsLoading={!ai.settings}
              needsKey={ai.needsKey}
              onOpenSettings={() => ai.setTab('settings')}
              isGenerating={ai.isGenerating}
              canGenerate={ai.canGenerate}
              onGenerate={() => void ai.handleGenerate()}
              result={ai.result}
              onViewBoard={() => ai.setOpen(false)}
            />
          </TabsContent>

          <TabsContent
            value="settings"
            className="scrollbar-thin-y scrollbar-light min-h-0 overflow-y-auto p-5"
          >
            {ai.settings ? (
              <AiBreakdownSettings
                settings={ai.settings}
                isGuest={ai.isGuest}
                onSaved={ai.setSettings}
              />
            ) : (
              <div className="flex justify-center py-10">
                <Loader size="md" />
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex shrink-0 items-center gap-2 border-t border-line bg-surface px-5 py-3 text-xs leading-5 text-ink-subtle">
          <Lock className="size-3.5 shrink-0" />
          Keys are encrypted at rest and never sent back to the browser.
        </div>
      </SheetContent>
    </Sheet>
  );
};
