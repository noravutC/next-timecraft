import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";

export type AiProvider = "claude" | "gemini";

export const AI_MODELS: Record<AiProvider, string> = {
  claude: "claude-opus-4-8",
  gemini: "gemini-2.5-flash",
};

export type AiUsage = {
  inputTokens: number;
  outputTokens: number;
  refused: boolean;
};

type StreamOptions = {
  apiKey: string;
  system: string;
  prompt: string;
  maxTokens: number;
  onText: (text: string) => void;
};

const streamClaude = async (opts: StreamOptions): Promise<AiUsage> => {
  const client = new Anthropic({ apiKey: opts.apiKey });
  const stream = client.messages.stream({
    model: AI_MODELS.claude,
    max_tokens: opts.maxTokens,
    thinking: { type: "adaptive" },
    system: opts.system,
    messages: [{ role: "user", content: opts.prompt }],
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      opts.onText(event.delta.text);
    }
  }

  const final = await stream.finalMessage();
  return {
    inputTokens: final.usage.input_tokens,
    outputTokens: final.usage.output_tokens,
    refused: final.stop_reason === "refusal",
  };
};

const streamGemini = async (opts: StreamOptions): Promise<AiUsage> => {
  const client = new GoogleGenAI({ apiKey: opts.apiKey });
  const stream = await client.models.generateContentStream({
    model: AI_MODELS.gemini,
    contents: opts.prompt,
    config: {
      systemInstruction: opts.system,
      maxOutputTokens: opts.maxTokens,
    },
  });

  let inputTokens = 0;
  let outputTokens = 0;
  for await (const chunk of stream) {
    if (chunk.text) opts.onText(chunk.text);
    // usageMetadata on each chunk is cumulative — keep the latest
    if (chunk.usageMetadata) {
      inputTokens = chunk.usageMetadata.promptTokenCount ?? inputTokens;
      outputTokens = chunk.usageMetadata.candidatesTokenCount ?? outputTokens;
    }
  }

  return { inputTokens, outputTokens, refused: false };
};

export const streamCompletion = (
  provider: AiProvider,
  opts: StreamOptions,
): Promise<AiUsage> =>
  provider === "claude" ? streamClaude(opts) : streamGemini(opts);
