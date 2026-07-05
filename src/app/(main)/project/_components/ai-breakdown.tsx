"use client";

import { useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { useTaskStore } from "@/store/use-task.store";
import { generateFractionBetween } from "@/helper/utils/fraction-string-indexing";

type BoardColumnLike = {
  id: string;
  title: string;
  cards: { orderFraction: string | null }[];
};

export const AiBreakdown = ({ columns }: { columns: BoardColumnLike[] }) => {
  const createTasks = useTaskStore((s) => s.createTasks);
  const [open, setOpen] = useState(false);
  const [goal, setGoal] = useState("");
  const [columnId, setColumnId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  if (columns.length === 0) return null;

  const targetColumn =
    columns.find((c) => c.id === columnId) ?? columns[0];

  const handleGenerate = async () => {
    if (isGenerating || goal.trim().length < 3) return;
    setIsGenerating(true);

    let lastFraction =
      targetColumn.cards.at(-1)?.orderFraction ?? null;
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
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ai-goal">What do you want to get done?</Label>
            <Textarea
              id="ai-goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Launch the marketing site by end of month"
              rows={3}
              disabled={isGenerating}
            />
          </div>
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
        </div>
      </PopoverContent>
    </Popover>
  );
};
