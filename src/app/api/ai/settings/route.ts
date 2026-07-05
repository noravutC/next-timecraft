import { db } from "@/db";
import { aiSettingsTable } from "@/db/schema";
import { createHandle } from "@/lib/api/handle";
import { encryptSecret } from "@/lib/ai/crypto";
import { getAiSettings } from "@/db/uniq-query/ai/ai-utils";
import { NextResponse } from "next/server";
import { z } from "zod";

const toStatus = (row: Awaited<ReturnType<typeof getAiSettings>>) => ({
  provider: row?.provider ?? "claude",
  hasClaudeKey: Boolean(row?.claudeKeyEncrypted),
  hasGeminiKey: Boolean(row?.geminiKeyEncrypted),
  hasServerFallback: Boolean(process.env.ANTHROPIC_API_KEY),
});

export type AiSettingsStatus = ReturnType<typeof toStatus>;

// Per-user resource — session check only, no project RBAC involved.
export const GET = createHandle(
  {},
  async ({ userId }) => {
    const row = await getAiSettings(userId);
    return NextResponse.json({
      data: toStatus(row),
      message: "Fetch AI settings success",
      status: 200,
    });
  },
);

const updateSchema = z.object({
  provider: z.enum(["claude", "gemini"]).optional(),
  // string = set a new key, null = remove, undefined = leave unchanged
  claudeApiKey: z.string().trim().min(10).max(500).nullable().optional(),
  geminiApiKey: z.string().trim().min(10).max(500).nullable().optional(),
});

type UpdateBody = z.infer<typeof updateSchema>;

export const PUT = createHandle<UpdateBody>(
  { body: updateSchema },
  async ({ userId, body }) => {
    const values: Partial<typeof aiSettingsTable.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (body.provider !== undefined) values.provider = body.provider;
    if (body.claudeApiKey !== undefined) {
      values.claudeKeyEncrypted =
        body.claudeApiKey === null ? null : encryptSecret(body.claudeApiKey);
    }
    if (body.geminiApiKey !== undefined) {
      values.geminiKeyEncrypted =
        body.geminiApiKey === null ? null : encryptSecret(body.geminiApiKey);
    }

    const [row] = await db
      .insert(aiSettingsTable)
      .values({ userId, ...values })
      .onConflictDoUpdate({ target: aiSettingsTable.userId, set: values })
      .returning();

    return NextResponse.json({
      updated: toStatus(row),
      message: "Update AI settings success",
      status: 200,
    });
  },
);
