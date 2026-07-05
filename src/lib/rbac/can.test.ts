import { describe, it, expect } from "vitest";
import { can } from "./can";
import { ROLE_PERMISSIONS, type ProjectRole } from "./permissions";

describe("can", () => {
  it("owner can do everything admin can, plus delete/transfer project", () => {
    expect(can("owner", "project:delete")).toBe(true);
    expect(can("owner", "project:transfer_ownership")).toBe(true);
    expect(can("admin", "project:delete")).toBe(false);
    expect(can("admin", "project:transfer_ownership")).toBe(false);
  });

  it("editor can work with tasks but not manage project/members", () => {
    expect(can("editor", "task:create")).toBe(true);
    expect(can("editor", "task:move")).toBe(true);
    expect(can("editor", "project:update")).toBe(false);
    expect(can("editor", "member:invite")).toBe(false);
    expect(can("editor", "column:create")).toBe(false);
  });

  it("viewer can only view and react", () => {
    expect(can("viewer", "project:view")).toBe(true);
    expect(can("viewer", "comment:react")).toBe(true);
    expect(can("viewer", "task:create")).toBe(false);
    expect(can("viewer", "task:update")).toBe(false);
    expect(can("viewer", "comment:upload")).toBe(false);
  });

  it("every role can at least view the project", () => {
    for (const role of Object.keys(ROLE_PERMISSIONS) as ProjectRole[]) {
      expect(can(role, "project:view")).toBe(true);
    }
  });

  it("role capabilities are strictly nested: viewer ⊆ editor ⊆ admin ⊆ owner", () => {
    const chain: ProjectRole[] = ["viewer", "editor", "admin", "owner"];
    for (let i = 0; i < chain.length - 1; i++) {
      const lower = ROLE_PERMISSIONS[chain[i]];
      const higher = ROLE_PERMISSIONS[chain[i + 1]];
      for (const p of lower) {
        expect(higher.has(p), `${chain[i + 1]} should include ${p}`).toBe(true);
      }
    }
  });
});
