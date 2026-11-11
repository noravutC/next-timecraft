import { test, expect } from '@playwright/test';
import { deleteCard, ensureBoard, signInAsGuest } from './guest';

const CARD_TITLE = `e2e done ${Date.now().toString(36)}`;

test.describe('done column', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsGuest(page);
    await ensureBoard(page);
  });

  test('ticking a card moves it to the Done column, Undo puts it back', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    // the Done column wears a check instead of its color dot
    const doneColumn = page
      .getByTestId('board-column')
      .filter({ has: page.getByRole('img', { name: 'Done column' }) });
    await expect(doneColumn).toHaveCount(1);

    const firstColumn = page.getByTestId('board-column').first();
    await firstColumn
      .getByRole('button', { name: /add a card to the top/i })
      .click();
    await firstColumn.getByLabel('Task title').fill(CARD_TITLE);
    await firstColumn
      .getByRole('button', { name: 'Add card', exact: true })
      .click();
    const card = page.locator(`[data-card-title="${CARD_TITLE}"]`);
    await expect(firstColumn.locator(card)).toBeVisible({ timeout: 15_000 });

    await card.hover();
    await card.getByRole('button', { name: 'Mark as done' }).click();
    await expect(doneColumn.locator(card)).toBeVisible({ timeout: 15_000 });
    await expect(
      card.getByRole('button', { name: 'Mark as not done' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Undo' }).first().click();
    await expect(firstColumn.locator(card)).toBeVisible({ timeout: 15_000 });

    await deleteCard(page, card);
  });
});
