import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    // Logic tests run in node. A component test opts into a DOM with
    // `// @vitest-environment jsdom` on its first line.
    include: ["src/**/*.test.{ts,tsx}"],
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/**/*.d.ts", "src/types/**"],
      reporter: ["text-summary", "html"],
      // A ratchet, not a goal: set just under today's numbers so coverage
      // can't slip, and raised as tests are added. Pure logic is held to
      // more than the UI around it.
      thresholds: {
        lines: 14,
        statements: 14,
        branches: 13,
        functions: 11,
        "src/helper/utils/**": { lines: 80, branches: 75, functions: 80 },
      },
    },
  },
});
