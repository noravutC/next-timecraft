import { describe, it, expect } from "vitest";
import { toRecord, toValueRecord } from "./object";

describe("toValueRecord", () => {
  it("maps every id to the given value", () => {
    expect(toValueRecord(["a", "b"], true)).toEqual({ a: true, b: true });
  });

  it("returns an empty record for no ids", () => {
    expect(toValueRecord([], 1)).toEqual({});
  });
});

describe("toRecord", () => {
  const items = [
    { id: "t1", title: "one" },
    { id: "t2", title: "two" },
  ];

  it("keys the record by the given field", () => {
    expect(toRecord(items, "id")).toEqual({
      t1: items[0],
      t2: items[1],
    });
  });

  it("applies the transformer when provided", () => {
    expect(toRecord(items, "id", (item) => item.title)).toEqual({
      t1: "one",
      t2: "two",
    });
  });

  it("last item wins on duplicate keys", () => {
    const dup = [
      { id: "x", n: 1 },
      { id: "x", n: 2 },
    ];
    expect(toRecord(dup, "id")).toEqual({ x: { id: "x", n: 2 } });
  });
});
