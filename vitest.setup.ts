import { afterEach } from "vitest";

// Only component tests (`// @vitest-environment jsdom`) have a document;
// the node tests skip loading the DOM matchers.
if (typeof document !== "undefined") {
  await import("@testing-library/jest-dom/vitest");
  const { cleanup } = await import("@testing-library/react");
  afterEach(cleanup);
}
