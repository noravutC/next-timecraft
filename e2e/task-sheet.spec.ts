import { test, expect } from '@playwright/test';
import { deleteCard, ensureBoard, signInAsGuest } from './guest';

const uniq = Date.now().toString(36);
const TITLE = `e2e sheet card ${uniq}`;

test('task sheet edits a card and the card reflects it', async ({ page }) => {
  test.setTimeout(120_000);
  await signInAsGuest(page);
  await ensureBoard(page);

  const firstColumn = page.getByTestId('board-column').first();
  await firstColumn
    .getByRole('button', { name: /add a card to the top/i })
    .click();
  await firstColumn.getByLabel('Task title').fill(TITLE);
  await firstColumn
    .getByRole('button', { name: 'Add card', exact: true })
    .click();
  const card = page.locator(`[data-card-title="${TITLE}"]`);
  await expect(card).toBeVisible({ timeout: 15_000 });
  await page.keyboard.press('Escape');

  // open the sheet from the card title
  await card.getByText(TITLE).click();
  const sheet = page.getByRole('dialog');
  await expect(sheet.getByRole('heading', { name: TITLE })).toBeVisible({
    timeout: 15_000,
  });

  // priority → High
  await sheet.getByRole('button', { name: 'Medium' }).click();
  await page.getByRole('menuitem', { name: 'High' }).click();
  await expect(sheet.getByRole('button', { name: 'High' })).toBeVisible();

  // add a subtask and check it off
  const newSubtask = sheet.getByLabel('New subtask');
  await newSubtask.fill('write the test');
  await newSubtask.press('Enter');
  const subtask = sheet.getByRole('checkbox', { name: 'write the test' });
  await expect(subtask).toBeVisible({ timeout: 15_000 });
  await subtask.click();
  await expect(subtask).toHaveAttribute('data-state', 'checked');

  // post a comment
  await sheet.getByLabel('Write a comment').fill('looks good');
  await sheet.getByRole('button', { name: 'Comment', exact: true }).click();
  await expect(sheet.getByText('looks good')).toBeVisible({ timeout: 15_000 });

  // close and check the card meta row
  await sheet.getByRole('button', { name: 'Close' }).click();
  await expect(sheet).not.toBeVisible();
  await expect(card.getByRole('img', { name: 'High priority' })).toBeVisible();
  await expect(card.getByText('1/1')).toBeVisible();

  // cleanup so e2e cards don't pile up on the shared guest board
  await deleteCard(page, card);
});
