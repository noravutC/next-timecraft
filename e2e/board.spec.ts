import { test, expect } from '@playwright/test';
import { deleteCard, ensureBoard, signInAsGuest } from './guest';

// Flows share one signed-in guest journey and build on each other.
test.describe.configure({ mode: 'serial' });

const uniq = Date.now().toString(36);
const CARD_TITLE = `e2e card ${uniq}`;

test.describe('kanban board', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsGuest(page);
    await ensureBoard(page);
  });

  test('board shows columns after guest signs in', async ({ page }) => {
    const columns = page.getByTestId('board-column');
    expect(await columns.count()).toBeGreaterThanOrEqual(2);
  });

  test('guest can create a card', async ({ page }) => {
    const firstColumn = page.getByTestId('board-column').first();
    // create at the TOP so the card stays inside the first loaded page —
    // later tests reload the board and must find it without scrolling
    await firstColumn
      .getByRole('button', { name: /add a card to the top/i })
      .click();
    await firstColumn.getByLabel('Task title').fill(CARD_TITLE);
    await firstColumn
      .getByRole('button', { name: 'Add card', exact: true })
      .click();

    // optimistic insert + server confirm
    await expect(
      firstColumn.locator(`[data-card-title="${CARD_TITLE}"]`),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('guest can drag the card to another column', async ({ page }) => {
    test.setTimeout(90_000);
    const card = page.locator(`[data-card-title="${CARD_TITLE}"]`);
    await expect(card).toBeVisible({ timeout: 15_000 });

    const columns = page.getByTestId('board-column');
    const targetColumn = columns.nth(1);
    const sourceName = await card
      .locator("xpath=ancestor::*[@data-testid='board-column']")
      .getAttribute('data-column-name');
    const targetName = await targetColumn.getAttribute('data-column-name');
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
        r.request().method() === 'PATCH' &&
        r.url().includes('/api/task/') &&
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
    await deleteCard(page, movedCard);
  });

  test('header + adds a card to the top of the column', async ({ page }) => {
    const topTitle = `e2e top card ${uniq}`;
    const firstColumn = page.getByTestId('board-column').first();

    await firstColumn
      .getByRole('button', { name: /add a card to the top/i })
      .click();
    await firstColumn.getByLabel('Task title').fill(topTitle);
    await firstColumn
      .getByRole('button', { name: 'Add card', exact: true })
      .click();

    const card = firstColumn.locator(`[data-card-title="${topTitle}"]`);
    await expect(card).toBeVisible({ timeout: 15_000 });
    // composer opened from the header inserts at the very top of the column
    await expect(
      firstColumn.locator('[data-card-title]').first(),
    ).toHaveAttribute('data-card-title', topTitle);

    // cleanup so e2e cards don't pile up on the shared guest board
    await deleteCard(page, card);
  });

  test('filtering narrows the board to matching tasks', async ({ page }) => {
    const filterTitle = `e2e filter card ${uniq}`;
    const otherTitle = `e2e unmatched ${uniq}`;
    const firstColumn = page.getByTestId('board-column').first();

    // seed one card to filter by and one that must drop out. Other specs add
    // cards to this shared board at the same time, so never count all cards.
    // (the composer stays open after a card is added)
    await firstColumn
      .getByRole('button', { name: /add card to the bottom/i })
      .last()
      .click();
    for (const title of [filterTitle, otherTitle]) {
      await firstColumn.getByLabel('Task title').fill(title);
      await firstColumn
        .getByRole('button', { name: 'Add card', exact: true })
        .click();
      await expect(page.locator(`[data-card-title="${title}"]`)).toBeVisible({
        timeout: 15_000,
      });
    }
    const card = page.locator(`[data-card-title="${filterTitle}"]`);
    const other = page.locator(`[data-card-title="${otherTitle}"]`);

    // search is debounced and refetches server-side
    await page.getByTestId('board-filter-search').fill(filterTitle);
    await expect(other).toHaveCount(0, { timeout: 15_000 });
    await expect(card).toBeVisible();

    await page.getByRole('button', { name: /clear all/i }).click();
    await expect(other).toBeVisible({ timeout: 15_000 });

    // cleanup so e2e cards don't pile up on the shared guest board
    await deleteCard(page, card);
    await deleteCard(page, other);
  });
});
