'use client';

import {
  Check,
  ChevronDown,
  Settings2,
  Sparkles,
  TriangleAlert,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { AiBreakdownSettings } from './ai-breakdown-settings';
import {
  PROVIDER_LABELS,
  useAiBreakdown,
  type BoardColumnLike,
  type Provider,
} from './use-ai-breakdown';

const TABS = [
  { key: 'generate', label: 'Generate', icon: Sparkles },
  { key: 'settings', label: 'Settings', icon: Settings2 },
] as const;

export const AiBreakdown = ({ columns }: { columns: BoardColumnLike[] }) => {
  const {
    open,
    setOpen,
    tab,
    setTab,
    settings,
    setSettings,
    goal,
    setGoal,
    setColumnId,
    isGenerating,
    targetColumn,
    provider,
    keyReady,
    canGenerate,
    switchProvider,
    handleGenerate,
  } = useAiBreakdown(columns);

  if (columns.length === 0 || !targetColumn) return null;

  return (
    <Sheet open={open} onOpenChange={(next) => !isGenerating && setOpen(next)}>
      <SheetTrigger asChild>
        {/* สเกลเดียวกับปุ่มใน bottom bar (h-10 / rounded-xl / เงา brand) ให้ดูเป็นชุดเดียวกัน */}
        <Button
          className="absolute right-5 bottom-5 z-10 h-10 gap-4 rounded-xl !p-5.5 text-sm font-semibold shadow-[0_3px_10px_rgba(91,80,230,0.35)] hover:bg-brand-dark"
          data-testid="ai-breakdown-trigger"
        >
          <Sparkles size={15} />
          AI Breakdown
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        showCloseButton={false}
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        <SheetHeader className="flex-row items-center gap-3 space-y-0 border-b px-5 py-4 text-left">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-violet-500">
            <Sparkles className="size-5 text-white" />
          </div>
          <div className="min-w-0">
            <SheetTitle className="text-lg font-semibold text-ink">
              AI Breakdown
            </SheetTitle>
            <SheetDescription className="text-sm text-ink-subtle">
              Generate tasks with Claude or Gemini
            </SheetDescription>
          </div>
          <SheetClose className="ml-auto flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-surface text-ink-muted transition-colors hover:bg-surface-active hover:text-ink">
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </SheetClose>
        </SheetHeader>

        <div className="flex gap-6 border-b px-5">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                '-mb-px flex cursor-pointer items-center gap-1.5 border-b-2 py-3 text-sm font-semibold transition-colors',
                tab === key
                  ? 'border-brand text-brand'
                  : 'border-transparent text-ink-subtle hover:text-ink',
              )}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="scrollbar-thin-y scrollbar-light min-h-0 flex-1 overflow-y-auto px-5 py-5 [overflow-anchor:none]">
          {tab === 'settings' && settings ? (
            <AiBreakdownSettings settings={settings} onSaved={setSettings} />
          ) : (
            <div className="flex flex-col">
              <p className="mb-2 text-sm font-semibold text-ink">
                Describe what you want to build
              </p>
              <Textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. Set up SSO login with Okta, including provisioning, tests, and docs"
                rows={5}
                disabled={isGenerating}
                className="rounded-xl border-line text-sm placeholder:text-ink-faint"
              />

              <div className="mt-5 grid grid-cols-2 gap-4">
                <div>
                  <p className="mb-1.5 text-xs font-semibold tracking-wider text-ink-subtle uppercase">
                    Model
                  </p>
                  <div className="flex rounded-lg bg-surface-active p-1">
                    {(Object.keys(PROVIDER_LABELS) as Provider[]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => switchProvider(p)}
                        disabled={isGenerating || !settings}
                        className={cn(
                          'flex-1 cursor-pointer rounded-md py-1.5 text-sm font-semibold transition-colors',
                          provider === p
                            ? 'bg-white text-brand shadow-sm'
                            : 'text-ink-subtle hover:text-ink',
                        )}
                      >
                        {PROVIDER_LABELS[p]}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-semibold tracking-wider text-ink-subtle uppercase">
                    Add to
                  </p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild disabled={isGenerating}>
                      <button
                        type="button"
                        className="flex h-9.5 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-line bg-white px-3 text-sm font-medium text-ink transition-colors hover:border-brand-line disabled:cursor-default disabled:opacity-50 data-[state=open]:border-brand-line"
                      >
                        <span className="truncate">{targetColumn.title}</span>
                        <ChevronDown className="size-4 shrink-0 text-ink-faint" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="max-h-64 w-(--radix-dropdown-menu-trigger-width) overflow-y-auto"
                    >
                      {columns.map((col) => (
                        <DropdownMenuItem
                          key={col.id}
                          onClick={() => setColumnId(col.id)}
                          className="justify-between gap-2"
                        >
                          <span className="truncate">{col.title}</span>
                          {col.id === targetColumn.id && (
                            <Check className="size-4 shrink-0 text-brand" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {settings && !keyReady && (
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
                  <TriangleAlert className="size-4 shrink-0" />
                  <span>
                    No API key for {PROVIDER_LABELS[provider]}. Add one in{' '}
                    <button
                      type="button"
                      onClick={() => setTab('settings')}
                      className="cursor-pointer font-semibold underline underline-offset-2"
                    >
                      Settings
                    </button>
                    .
                  </span>
                </div>
              )}

              <Button
                onClick={() => void handleGenerate()}
                disabled={!canGenerate}
                className="mt-5 h-11 w-full gap-2 rounded-xl text-sm font-semibold shadow-[0_8px_24px_rgba(91,80,230,0.3)] hover:bg-brand-dark disabled:shadow-none"
              >
                {isGenerating ? (
                  <>
                    <Loader size="xs" onColor />
                    Generating…
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    Generate tasks
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
