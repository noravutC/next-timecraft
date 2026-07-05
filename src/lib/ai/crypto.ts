import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

// AES-256-GCM for AI API keys at rest. The data key is derived from
// AI_ENCRYPTION_KEY when set, otherwise from NEXTAUTH_SECRET — rotating
// either invalidates stored keys (users must re-enter them).
const getKey = (): Buffer => {
  const secret = process.env.AI_ENCRYPTION_KEY ?? process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("No encryption secret configured");
  return createHash("sha256").update(`ai-key:${secret}`).digest();
};

export const encryptSecret = (plaintext: string): string => {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
};

export const decryptSecret = (payload: string): string => {
  const raw = Buffer.from(payload, "base64");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const encrypted = raw.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString("utf8");
};
