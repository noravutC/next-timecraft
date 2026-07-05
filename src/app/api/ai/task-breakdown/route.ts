import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/db";
import { columnsTable } from "@/db/schema";
import { createHandle } from "@/lib/api/handle";
import { AppError, NotFoundError } from "@/lib/api/errors";
import { CLAUDE_MODEL, getClaudeClient, isAiConfigured } from "@/lib/ai/claude";
import { authorizeOrThrow } from "@/lib/rbac/authorize";
import { eq } from "drizzle-orm";
import { z } from "zod";

const breakdownSchema = z.object({
  goal: z.string().trim().min(3).max(2000),
  columnId: z.string().trim().min(1),
  maxTasks: z.number().int().min(1).max(12).optional(),
});

type BreakdownBody = z.infer<typeof breakdownSchema>;

// Claude is instructed to answer in NDJSON (one JSON object per line) so we
// can validate + forward each subtask the moment its line completes.
const subtaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).nullable().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
});

export type AiSubtask = z.infer<typeof subtaskSchema>;

const SYSTEM_PROMPT = `You are a project-planning assistant inside a Kanban app.
The user gives you a goal; you break it down into concrete, actionable subtasks.

Output rules (strict):
- Respond with NDJSON only: one JSON object per line, no markdown, no prose, no code fences.
- Each line: {"title": string, "description": string | null, "priority": "low" | "medium" | "high"}
- "title" is short and imperative (max ~10 words). "description" is 1-2 sentences of concrete detail, or null.
- Order lines by execution order (first thing to do first).
- Write titles and descriptions in the same language the user wrote the goal in.`;

const sseEncode = (event: string, data: unknown) =>
  `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

export const POST = createHandle<BreakdownBody>(
  { body: breakdownSchema },
  async ({ userId, body }) => {
    const [column] = await db
      .select({ id: columnsTable.id, projectId: columnsTable.projectId })
      .from(columnsTable)
      .where(eq(columnsTable.id, body.columnId))
      .limit(1);
    if (!column) throw new NotFoundError("Column not found");

    await authorizeOrThrow(userId, [column.projectId], "task:create");

    if (!isAiConfigured()) {
      throw new AppError(503, "AI is not configured on this server");
    }

    const client = getClaudeClient();
    const maxTasks = body.maxTasks ?? 8;
    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (event: string, data: unknown) =>
          controller.enqueue(encoder.encode(sseEncode(event, data)));

        let buffer = "";
        let sent = 0;

        const flushLine = (line: string) => {
          const trimmed = line.trim();
          if (!trimmed || sent >= maxTasks) return;
          try {
            const parsed = subtaskSchema.safeParse(JSON.parse(trimmed));
            if (parsed.success) {
              sent += 1;
              send("task", parsed.data);
            }
            // malformed lines are skipped — the client only ever sees
            // schema-valid subtasks
          } catch {
            /* not valid JSON — skip */
          }
        };

        try {
          const claudeStream = client.messages.stream({
            model: CLAUDE_MODEL,
            max_tokens: 8192,
            thinking: { type: "adaptive" },
            system: SYSTEM_PROMPT,
            messages: [
              {
                role: "user",
                content: `Break this goal into at most ${maxTasks} subtasks:\n\n${body.goal}`,
              },
            ],
          });

          for await (const event of claudeStream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              buffer += event.delta.text;
              let newlineIdx = buffer.indexOf("\n");
              while (newlineIdx !== -1) {
                flushLine(buffer.slice(0, newlineIdx));
                buffer = buffer.slice(newlineIdx + 1);
                newlineIdx = buffer.indexOf("\n");
              }
            }
          }
          flushLine(buffer);

          const final = await claudeStream.finalMessage();
          if (final.stop_reason === "refusal") {
            send("error", { message: "AI declined this request" });
          } else {
            send("done", { count: sent });
          }
        } catch (error) {
          // headers are already sent — surface errors as an SSE event
          let message = "AI request failed";
          if (error instanceof Anthropic.RateLimitError) {
            message = "AI is busy right now — try again in a minute";
          } else if (error instanceof Anthropic.AuthenticationError) {
            message = "AI is misconfigured on this server";
          } else if (error instanceof Anthropic.APIConnectionError) {
            message = "Could not reach the AI service";
          } else {
            console.error("[ai/task-breakdown]", error);
          }
          send("error", { message });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  },
);
