import type { AiSubtask } from "@/app/api/ai/task-breakdown/route";

export type AiBreakdownHandlers = {
  onTask: (task: AiSubtask) => void | Promise<void>;
  onDone: (count: number) => void;
  onError: (message: string) => void;
};

// Uses native fetch instead of the shared axios client: the browser build of
// axios buffers the whole response, so an SSE stream can't be consumed
// incrementally through it. Auth still works — the route reads the session
// cookie, which same-origin fetch sends automatically.
class AiService {
  async streamTaskBreakdown(
    payload: { goal: string; columnId: string; maxTasks?: number },
    handlers: AiBreakdownHandlers,
  ): Promise<void> {
    const response = await fetch("/api/ai/task-breakdown", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok || !response.body) {
      const data = await response.json().catch(() => null);
      handlers.onError(data?.message ?? "AI request failed");
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    const processChunk = async (chunk: string) => {
      // SSE frames are separated by a blank line
      const frames = chunk.split("\n\n");
      buffer = frames.pop() ?? "";
      for (const frame of frames) {
        let event = "";
        let data = "";
        for (const line of frame.split("\n")) {
          if (line.startsWith("event: ")) event = line.slice(7).trim();
          else if (line.startsWith("data: ")) data += line.slice(6);
        }
        if (!event || !data) continue;
        try {
          const parsed = JSON.parse(data);
          if (event === "task") await handlers.onTask(parsed as AiSubtask);
          else if (event === "done") handlers.onDone(parsed.count ?? 0);
          else if (event === "error")
            handlers.onError(parsed.message ?? "AI request failed");
        } catch {
          /* skip malformed frame */
        }
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      await processChunk(buffer + decoder.decode(value, { stream: true }));
    }
  }
}

export const aiServices = new AiService();
