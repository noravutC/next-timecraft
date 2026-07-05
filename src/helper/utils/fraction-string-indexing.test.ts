import { describe, it, expect } from "vitest";
import {
  isValidFractionKey,
  assignBulkIndexes,
  generateFractionBetween,
} from "./fraction-string-indexing";

describe("isValidFractionKey", () => {
  it("rejects null, undefined and empty string", () => {
    expect(isValidFractionKey(null)).toBe(false);
    expect(isValidFractionKey(undefined)).toBe(false);
    expect(isValidFractionKey("")).toBe(false);
  });

  it("accepts a valid fraction key", () => {
    expect(isValidFractionKey("a0")).toBe(true);
  });

  it("rejects garbage that is not a fraction key", () => {
    expect(isValidFractionKey("!!not-a-key!!")).toBe(false);
  });
});

describe("generateFractionBetween", () => {
  it("generates a key between two keys that sorts between them", () => {
    const prev = "a0";
    const next = "a1";
    const mid = generateFractionBetween(prev, next);
    expect(mid > prev).toBe(true);
    expect(mid < next).toBe(true);
  });

  it("generates a first key when both bounds are empty", () => {
    expect(generateFractionBetween(null, null)).toBeTruthy();
  });

  it("generates a key after prev when next is null (append to end)", () => {
    const prev = "a0";
    const key = generateFractionBetween(prev, null);
    expect(key > prev).toBe(true);
  });

  it("generates a key before next when prev is null (insert at start)", () => {
    const next = "a0";
    const key = generateFractionBetween(null, next);
    expect(key < next).toBe(true);
  });

  it("treats invalid bounds as null instead of throwing", () => {
    expect(() => generateFractionBetween("!!bad!!", "??bad??")).not.toThrow();
  });

  it("supports repeated insertion between the same two keys", () => {
    // simulate dragging many cards into the same gap
    let prev = "a0";
    const next = "a1";
    const keys: string[] = [];
    for (let i = 0; i < 50; i++) {
      const k = generateFractionBetween(prev, next);
      keys.push(k);
      prev = k;
    }
    const sorted = [...keys].sort();
    expect(keys).toEqual(sorted);
    expect(keys.every((k) => k > "a0" && k < "a1")).toBe(true);
  });
});

describe("assignBulkIndexes", () => {
  it("returns the same (empty) array for empty payloads", () => {
    expect(assignBulkIndexes([])).toEqual([]);
  });

  it("assigns strictly ascending keys to every payload", () => {
    const items = [{ title: "a" }, { title: "b" }, { title: "c" }];
    const result = assignBulkIndexes(items);
    const keys = result.map((r) => r.orderFraction!);
    expect(keys).toHaveLength(3);
    expect([...keys].sort()).toEqual(keys);
    expect(new Set(keys).size).toBe(3);
  });

  it("keeps all generated keys between prev and next bounds", () => {
    const items = [{}, {}, {}, {}];
    const result = assignBulkIndexes(items, "a0", "a1");
    for (const r of result) {
      expect(r.orderFraction! > "a0").toBe(true);
      expect(r.orderFraction! < "a1").toBe(true);
    }
  });

  it("does not mutate the original items", () => {
    const items = [{ title: "a", orderFraction: null }];
    assignBulkIndexes(items);
    expect(items[0].orderFraction).toBeNull();
  });

  it("sanitizes invalid bounds instead of throwing", () => {
    expect(() => assignBulkIndexes([{}], "!!bad!!", "??bad??")).not.toThrow();
  });
});
