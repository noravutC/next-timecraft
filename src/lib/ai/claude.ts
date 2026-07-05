import Anthropic from "@anthropic-ai/sdk";

// Lazy singleton (same pattern as src/db/index.ts) — constructing the client
// at import time would crash builds/environments without ANTHROPIC_API_KEY.
let _client: Anthropic | undefined;

export const isAiConfigured = () => Boolean(process.env.ANTHROPIC_API_KEY);

export function getClaudeClient(): Anthropic {
  if (!_client) {
    if (!isAiConfigured()) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }
    _client = new Anthropic();
  }
  return _client;
}

export const CLAUDE_MODEL = "claude-opus-4-8";
