import { db } from "@/db";
import { aiSettingsTable, aiUsageLogsTable } from "@/db/schema";
import { decryptSecret } from "@/lib/ai/crypto";
import type { AiProvider } from "@/lib/ai/providers";
import { eq } from "drizzle-orm";

export async function getAiSettings(userId: string) {
  const [row] = await db
    .select()
    .from(aiSettingsTable)
    .where(eq(aiSettingsTable.userId, userId))
    .limit(1);
  return row ?? null;
}

/**
 * Resolve the provider + decrypted API key for a user.
 * Falls back to the server's ANTHROPIC_API_KEY (Claude only) when the user
 * has no key stored for their selected provider.
 */
export async function resolveAiCredentials(userId: string): Promise<{
  provider: AiProvider;
  apiKey: string;
} | null> {
  const settings = await getAiSettings(userId);
  const provider: AiProvider = settings?.provider ?? "claude";

  const encrypted =
    provider === "claude"
      ? settings?.claudeKeyEncrypted
      : settings?.geminiKeyEncrypted;

  if (encrypted) {
    try {
      return { provider, apiKey: decryptSecret(encrypted) };
    } catch (error) {
      console.error("[ai] failed to decrypt stored key:", error);
      // fall through to the server fallback
    }
  }

  if (process.env.ANTHROPIC_API_KEY) {
    return { provider: "claude", apiKey: process.env.ANTHROPIC_API_KEY };
  }
  return null;
}

export async function insertAiUsageLog(
  entry: typeof aiUsageLogsTable.$inferInsert,
) {
  try {
    await db.insert(aiUsageLogsTable).values(entry);
  } catch (error) {
    // logging must never break the feature itself
    console.error("[ai] failed to write usage log:", error);
  }
}
