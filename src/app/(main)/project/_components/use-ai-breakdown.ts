import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { aiServices } from '@/services/ai.service';
import type { AiSettingsStatus } from '@/app/api/ai/settings/route';
import { useTaskStore } from '@/store/use-task.store';
import { generateFractionBetween } from '@/helper/utils/fraction-string-indexing';

export type BoardColumnLike = {
  id: string;
  title: string;
  nextCursorFraction: string | null;
  cards: { orderFraction: string | null }[];
};

export const PROVIDER_LABELS = { claude: 'Claude', gemini: 'Gemini' } as const;
export type Provider = keyof typeof PROVIDER_LABELS;

export type TabKey = 'generate' | 'settings';

/**
 * State + handlers ของ AI Breakdown sheet:
 * โหลด settings, สลับ provider (optimistic), stream สร้าง task ลง column เป้าหมาย
 */
export function useAiBreakdown(columns: BoardColumnLike[]) {
  const createTasks = useTaskStore((s) => s.createTasks);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<TabKey>('generate');
  const [settings, setSettings] = useState<AiSettingsStatus | null>(null);
  const [goal, setGoal] = useState('');
  const [columnId, setColumnId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // เปิด sheet ใหม่ให้กลับมาแท็บ Generate เสมอ (adjust-state-on-prop-change)
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setTab('generate');
  }

  useEffect(() => {
    if (!open || settings) return;
    aiServices
      .getSettings()
      .then((res) => setSettings(res.data))
      .catch(() => setSettings(null));
  }, [open, settings]);

  const targetColumn = columns.find((c) => c.id === columnId) ?? columns[0];
  const provider: Provider = settings?.provider ?? 'claude';
  // Claude มี key ฝั่ง server ให้ fallback ได้ — Gemini ต้องมี key ของตัวเอง
  const keyReady = settings
    ? provider === 'claude'
      ? settings.hasClaudeKey || settings.hasServerFallback
      : settings.hasGeminiKey
    : false;
  const canGenerate =
    !isGenerating && keyReady && goal.trim().length >= 3 && Boolean(settings);

  const switchProvider = (next: Provider) => {
    if (!settings || settings.provider === next) return;
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
          },
          onDone: (count) => {
            toast.success(
              count > 0
                ? `Added ${count} tasks to ${targetColumn.title}`
                : 'AI returned no tasks — try a more specific goal',
            );
          },
          onError: (message) => toast.error(message),
        },
      );
      if (created > 0) {
        setGoal('');
        setOpen(false);
      }
    } catch (error) {
      console.error('AI breakdown failed:', error);
      toast.error('AI request failed');
    } finally {
      setIsGenerating(false);
    }
  };

  return {
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
  };
}
