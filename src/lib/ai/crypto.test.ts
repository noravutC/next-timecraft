import { describe, it, expect, beforeEach } from "vitest";
import { encryptSecret, decryptSecret } from "./crypto";

beforeEach(() => {
  process.env.AI_ENCRYPTION_KEY = "test-secret-for-unit-tests";
});

describe("AI key encryption", () => {
  it("round-trips a secret", () => {
    const key = "sk-ant-api03-example-key-1234567890";
    expect(decryptSecret(encryptSecret(key))).toBe(key);
  });

  it("produces a different ciphertext each time (random IV)", () => {
    expect(encryptSecret("same-input")).not.toBe(encryptSecret("same-input"));
  });

  it("does not contain the plaintext in the payload", () => {
    const payload = encryptSecret("super-secret-key");
    expect(payload).not.toContain("super-secret-key");
    expect(Buffer.from(payload, "base64").toString("utf8")).not.toContain(
      "super-secret-key",
    );
  });

  it("fails to decrypt a tampered payload", () => {
    const payload = encryptSecret("secret");
    const raw = Buffer.from(payload, "base64");
    raw[raw.length - 1] ^= 0xff;
    expect(() => decryptSecret(raw.toString("base64"))).toThrow();
  });

  it("fails to decrypt with a different encryption secret", () => {
    const payload = encryptSecret("secret");
    process.env.AI_ENCRYPTION_KEY = "a-different-secret";
    expect(() => decryptSecret(payload)).toThrow();
  });
});
