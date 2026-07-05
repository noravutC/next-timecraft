"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ChevronDown, Settings2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader } from "@/components/ui/loader";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { aiServices } from "@/services/ai.service";
import type { AiSettingsStatus } from "@/app/api/ai/settings/route";
import { useTaskStore } from "@/store/use-task.store";
import { generateFractionBetween } from "@/helper/utils/fraction-string-indexing";

type BoardColumnLike = {
  id: string;
  title: string;
  cards: { orderFraction: string | null }[];
};

const PROVIDER_LABELS = { claude: "Claude", gemini: "Gemini" } as const;
type Provider = keyof typeof PROVIDER_LABELS;

const AiSettingsView = ({
  settings,
  onSaved,
  onBack,
}: {
  settings: AiSettingsStatus;
  onSaved: (next: AiSettingsStatus) => void;
  onBack: () => void;
}) => {
  const [provider, setProvider] = useState<Provider>(settings.provider);
  const [apiKey, setApiKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const hasKey =
    provider === "claude" ? settings.hasClaudeKey : settings.hasGeminiKey;

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const trimmed = apiKey.trim();
      const { updated } = await aiServices.updateSettings({
        provider,
        ...(trimmed
          ? provider === "claude"
            ? { claudeApiKey: trimmed }
            : { geminiApiKey: trimmed }
          : {}),
      });
      if (updated) onSaved(updated);
      setApiKey("");
      toast.success("AI settings saved");
      onBack();
    } catch (error) {
      console.error("Save AI settings failed:", error);
      toast.error("Failed to save AI settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="size-7" onClick={onBack}>
          <ArrowLeft size={14} />
        </Button>
        <span className="text-sm font-semibold">AI settings</span>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Provider</Label>
        <div className="flex gap-2">
          {(Object.keys(PROVIDER_LABELS) as Provider[]).map((p) => (
            <Button
              key={p}
              variant={provider === p ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => setProvider(p)}
            >
              {PROVIDER_LABELS[p]}
            </Button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ai-api-key">{PROVIDER_LABELS[provider]} API key</Label>
        <Input
          id="ai-api-key"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={
            hasKey ? "•••••••• (saved — enter to replace)" : "Paste your API key"
          }
          autoComplete="off"
        />
        <p className="text-xs text-muted-foreground">
          Stored encrypted on the server and only used for your own requests.
          {!hasKey && settings.hasServerFallback && provider === "claude"
            ? " Leave empty to use the server's shared Claude key."
            : ""}
        </p>
      </div>
      <Button size="sm" onClick={handleSave} disabled={isSaving}>
        {isSaving ? <Loader size="xs" onColor /> : "Save"}
      </Button>
    </div>
  );
};

export const AiBreakdown = ({ columns }: { columns: BoardColumnLike[] }) => {
  const createTasks = useTaskStore((s) => s.createTasks);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"generate" | "settings">("generate");
  const [settings, setSettings] = useState<AiSettingsStatus | null>(null);
  const [goal, setGoal] = useState("");
  const [columnId, setColumnId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!open || settings) return;
    aiServices
      .getSettings()
      .then((res) => setSettings(res.data))
      .catch(() => setSettings(null));
  }, [open, settings]);

  if (columns.length === 0) return null;

  const targetColumn = columns.find((c) => c.id === columnId) ?? columns[0];

  const handleGenerate = async () => {
    if (isGenerating || goal.trim().length < 3) return;
    setIsGenerating(true);

    let lastFraction = targetColumn.cards.at(-1)?.orderFraction ?? null;
    let created = 0;

    try {
      await aiServices.streamTaskBreakdown(
        { goal: goal.trim(), columnId: targetColumn.id },
        {
          onTask: async (task) => {
            lastFraction = generateFractionBetween(lastFraction, null);
            await createTasks([
              {
                columnId: targetColumn.id,
                title: task.title,
                description: task.description ?? null,
                priority: task.priority ?? "medium",
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
                : "AI returned no tasks — try a more specific goal",
            );
          },
          onError: (message) => toast.error(message),
        },
      );
      if (created > 0) {
        setGoal("");
        setOpen(false);
      }
    } catch (error) {
      console.error("AI breakdown failed:", error);
      toast.error("AI request failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const providerLabel = settings ? PROVIDER_LABELS[settings.provider] : null;

  return (
    <Popover open={open} onOpenChange={(next) => !isGenerating && setOpen(next)}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          className="absolute right-5 bottom-5 z-10 gap-1.5 shadow-lg"
          data-testid="ai-breakdown-trigger"
        >
          <Sparkles size={15} />
          AI breakdown
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" side="top" className="w-80">
        {view === "settings" && settings ? (
          <AiSettingsView
            settings={settings}
            onSaved={setSettings}
            onBack={() => setView("generate")}
          />
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="ai-goal">What do you want to get done?</Label>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => setView("settings")}
                disabled={isGenerating || !settings}
                aria-label="AI settings"
              >
                <Settings2 size={14} />
              </Button>
            </div>
            <Textarea
              id="ai-goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Launch the marketing site by end of month"
              rows={3}
              disabled={isGenerating}
            />
            <div className="flex items-center justify-between gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={isGenerating}>
                    {targetColumn.title}
                    <ChevronDown size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {columns.map((col) => (
                    <DropdownMenuItem
                      key={col.id}
                      onClick={() => setColumnId(col.id)}
                    >
                      {col.title}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                size="sm"
                onClick={handleGenerate}
                disabled={isGenerating || goal.trim().length < 3}
              >
                {isGenerating ? (
                  <>
                    <Loader size="xs" onColor />
                    Generating…
                  </>
                ) : (
                  "Generate tasks"
                )}
              </Button>
            </div>
            {providerLabel && (
              <p className="text-xs text-muted-foreground">
                Using {providerLabel}
              </p>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
