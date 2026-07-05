import { test, expect, type Page } from "@playwright/test";

// Flows share one signed-in guest journey and build on each other.
test.describe.configure({ mode: "serial" });

const uniq = Date.now().toString(36);
const CARD_TITLE = `e2e card ${uniq}`;

const signInAsGuest = async (page: Page) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /continue as guest/i }).click();
  await page.waitForURL(/\/project/, { timeout: 30_000 });
};

/** Guest workspace may or may not already have a project. */
const ensureBoard = async (page: Page) => {
  const column = page.getByTestId("board-column").first();
  const templatePicker = page.getByText(/choose a popular template/i);
  await expect(column.or(templatePicker)).toBeVisible({ timeout: 30_000 });

  if (await templatePicker.isVisible()) {
    await page.getByRole("button", { name: /basic kanban/i }).click();
    await page
      .getByPlaceholder("Enter project name")
      .fill(`E2E Project ${uniq}`);
    await page.getByRole("button", { name: /create project/i }).click();
  }
  await expect(column).toBeVisible({ timeout: 30_000 });
};

test.describe("kanban board", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsGuest(page);
    await ensureBoard(page);
  });

  test("board shows columns after guest signs in", async ({ page }) => {
    const columns = page.getByTestId("board-column");
    expect(await columns.count()).toBeGreaterThanOrEqual(2);
  });

  test("guest can create a card", async ({ page }) => {
    const firstColumn = page.getByTestId("board-column").first();
    // a column has two "Add a card" affordances (header icon + footer button)
    await firstColumn.getByRole("button", { name: "Add a card" }).last().click();
    await firstColumn.getByPlaceholder("Task title...").fill(CARD_TITLE);
    await firstColumn.getByRole("button", { name: "Add card" }).click();

    // optimistic insert + server confirm
    await expect(
      firstColumn.locator(`[data-card-title="${CARD_TITLE}"]`),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("guest can drag the card to another column", async ({ page }) => {
    test.setTimeout(90_000);
    const card = page.locator(`[data-card-title="${CARD_TITLE}"]`);
    await expect(card).toBeVisible({ timeout: 15_000 });

    const columns = page.getByTestId("board-column");
    const targetColumn = columns.nth(1);
    const sourceName = await card
      .locator("xpath=ancestor::*[@data-testid='board-column']")
      .getAttribute("data-column-name");
    const targetName = await targetColumn.getAttribute("data-column-name");
    expect(targetName).not.toBe(sourceName);

    // pragmatic-drag-and-drop uses native HTML5 DnD; drive it with raw
    // mouse events so dragstart fires reliably in headless chromium.
    const cardBox = (await card.boundingBox())!;
    const targetBox = (await targetColumn.boundingBox())!;
    await page.mouse.move(
      cardBox.x + cardBox.width / 2,
      cardBox.y + cardBox.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
      targetBox.x + targetBox.width / 2,
      targetBox.y + Math.min(targetBox.height / 2, 200),
      { steps: 20 },
    );
    // the drop fires an optimistic PATCH; wait for the server ack before
    // reloading, otherwise the reload can race the request
    const patchDone = page.waitForResponse(
      (r) =>
        r.request().method() === "PATCH" &&
        r.url().includes("/api/task/") &&
        r.ok(),
      { timeout: 15_000 },
    );
    await page.mouse.up();
    await patchDone;

    await expect(
      targetColumn.locator(`[data-card-title="${CARD_TITLE}"]`),
    ).toBeVisible({ timeout: 15_000 });

    // survives reload = persisted on the server, not just optimistic state
    await page.reload();
    await ensureBoard(page);
    const movedCard = page
      .locator(`[data-column-name="${targetName}"]`)
      .locator(`[data-card-title="${CARD_TITLE}"]`);
    await expect(movedCard).toBeVisible({ timeout: 30_000 });

    // cleanup so e2e cards don't pile up on the shared guest board
    await movedCard.hover();
    await movedCard.getByRole("button", { name: "Task actions" }).click();
    await page.getByRole("menuitem", { name: /delete card/i }).click();
    await expect(movedCard).not.toBeVisible({ timeout: 15_000 });
  });
});
