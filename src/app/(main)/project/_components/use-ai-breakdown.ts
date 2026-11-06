import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { aiServices } from '@/services/ai.service';
import type { AiSettingsStatus } from '@/app/api/ai/settings/route';
import { useTaskStore } from '@/store/use-task.store';
import { generateFractionBetween } from '@/helper/utils/fraction-string-indexing';
import { isGuestSession } from '@/lib/guest';
import { isProviderReady, type Provider } from './ai-breakdown-providers';

export type BoardColumnLike = {
  id: string;
  title: string;
  color?: string;
  nextCursorFraction: string | null;
  cards: { orderFraction: string | null }[];
};

export type TabKey = 'generate' | 'settings';

/** Tasks created by the last run, listed in the sheet as they stream in. */
export type BreakdownResult = { columnTitle: string; titles: string[] };

/**
 * State + handlers ของ AI Breakdown sheet:
 * โหลด settings, สลับ provider (optimistic), stream สร้าง task ลง column เป้าหมาย
 */
export function useAiBreakdown(columns: BoardColumnLike[]) {
  const createTasks = useTaskStore((s) => s.createTasks);
  const { data: session } = useSession();
  const isGuest = isGuestSession(session);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<TabKey>('generate');
  const [settings, setSettings] = useState<AiSettingsStatus | null>(null);
  const [goal, setGoal] = useState('');
  const [columnId, setColumnId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<BreakdownResult | null>(null);

  // เปิด sheet ใหม่ให้กลับมาแท็บ Generate และล้างผลรอบก่อน (adjust-state-on-prop-change)
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setTab('generate');
      setResult(null);
    }
  }

  useEffect(() => {
    if (!open || settings) return;
    aiServices
      .getSettings()
      .then((res) => setSettings(res.data))
      .catch(() => setSettings(null));
  }, [open, settings]);

  const targetColumn = columns.find((c) => c.id === columnId) ?? columns[0];
  // guests can't save a provider choice; they always run on the server's Claude key
  const provider: Provider = isGuest
    ? 'claude'
    : (settings?.provider ?? 'claude');
  const keyReady = settings
    ? isProviderReady(settings, provider, isGuest)
    : false;
  const canGenerate =
    !isGenerating && keyReady && goal.trim().length >= 3 && Boolean(settings);

  const switchProvider = (next: Provider) => {
    if (!settings || isGuest || settings.provider === next) return;
    const prev = settings;
    setSettings({ ...settings, provider: next });
    aiServices.updateSettings({ provider: next }).catch(() => {
      setSettings(prev);
      toast.error('Failed to switch model');
    });
  };

  const handleGenerate = async () => {
    if (!canGenerate || !targetColumn) return;
    setIsGenerating(true);
    setResult({ columnTitle: targetColumn.title, titles: [] });

    let lastFraction = targetColumn.cards.at(-1)?.orderFraction ?? null;
    let created = 0;

    try {
      await aiServices.streamTaskBreakdown(
        { goal: goal.trim(), columnId: targetColumn.id },
        {
          onTask: async (task) => {
            lastFraction = generateFractionBetween(
              lastFraction,
              targetColumn.nextCursorFraction,
            );
            await createTasks([
              {
                columnId: targetColumn.id,
                title: task.title,
                description: task.description ?? null,
                priority: task.priority ?? 'medium',
                orderFraction: lastFraction,
                tags: [],
                dueDate: null,
              },
            ]);
            created += 1;
            setResult((r) => r && { ...r, titles: [...r.titles, task.title] });
          },
          onDone: (count) => {
            if (count === 0) {
              toast('AI returned no tasks. Try a more specific goal.');
            }
          },
          onError: (message) => toast.error(message),
        },
      );
      // the goal stays so it can be tweaked and run again
      if (created === 0) setResult(null);
    } catch (error) {
      console.error('AI breakdown failed:', error);
      toast.error('AI request failed');
      if (created === 0) setResult(null);
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    open,
    setOpen,
    tab,
    setTab,
    isGuest,
    settings,
    setSettings,
    goal,
    setGoal,
    setColumnId,
    isGenerating,
    targetColumn,
    provider,
    needsKey: Boolean(settings) && !keyReady,
    canGenerate,
    result,
    switchProvider,
    handleGenerate,
  };
}
