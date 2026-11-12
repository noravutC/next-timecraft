import { expect, test } from '@playwright/test';
import { ensureBoard, signInAsGuest } from './guest';

test.describe('automation', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsGuest(page);
    await ensureBoard(page);
    await page.getByRole('radio', { name: 'Automation' }).click();
    // the Rules list, or the page that stands in for it on a board with none
    await expect(
      page
        .getByRole('heading', { name: 'Let the board do the routine work' })
        .or(page.getByText('This week so far:')),
    ).toBeVisible({ timeout: 30_000 });
  });

  const section = (page: import('@playwright/test').Page, name: RegExp) =>
    page
      .getByRole('radiogroup', { name: 'Automation section' })
      .getByRole('radio', { name });

  test('is a view of the board, kept in the link', async ({ page }) => {
    await expect(page).toHaveURL(/view=automation/);
    await page.reload();
    await expect(page.getByRole('radio', { name: 'Automation' })).toBeChecked();
    await expect(section(page, /^Rules/)).toBeChecked();
  });

  test('a rule is built from a When and a Then, switched off and deleted', async ({
    page,
  }) => {
    // other specs share this board: a rule that only notifies changes nothing
    const rows = page.getByRole('button', { name: /^When a task is finished/ });
    const before = await rows.count();

    await page.getByRole('button', { name: 'New rule' }).click();
    const sheet = page.getByRole('dialog', { name: 'New rule' });
    await expect(
      sheet.getByText('Pick a When and a Then to save'),
    ).toBeVisible();
    await sheet.getByRole('button', { name: /^A task is finished/ }).click();
    await sheet.getByRole('button', { name: 'Notify someone' }).click();
    await expect(
      sheet.getByText('When a task is finished, notify the assignees.'),
    ).toBeVisible();
    await sheet.getByRole('button', { name: 'Save rule' }).click();
    await expect(sheet).not.toBeVisible({ timeout: 15_000 });
    await expect(rows).toHaveCount(before + 1, { timeout: 15_000 });

    const switchedOff = page.getByRole('switch', {
      name: /^Turn on: When a task is finished/,
    });
    const off = await switchedOff.count();
    await page
      .getByRole('switch', { name: /^Turn off: When a task is finished/ })
      .last()
      .click();
    await expect(switchedOff).toHaveCount(off + 1);

    await page
      .getByRole('button', { name: /^More actions: When a task is finished/ })
      .last()
      .click();
    await page.getByRole('menuitem', { name: 'Delete rule' }).click();
    await page
      .getByRole('dialog', { name: 'Delete this rule?' })
      .getByRole('button', { name: 'Delete rule' })
      .click();
    await expect(rows).toHaveCount(before, { timeout: 15_000 });
  });

  test('a template is saved and deleted', async ({ page }) => {
    const title = `E2E template ${Date.now()}`;
    await section(page, /^Templates/).click();
    await page.getByRole('button', { name: 'New template' }).first().click();
    const sheet = page.getByRole('dialog');
    await sheet.getByLabel('Template title').fill(title);
    await sheet.getByRole('button', { name: 'Add a subtask' }).click();
    await sheet.getByLabel('Subtask 1', { exact: true }).fill('First step');
    await sheet.getByRole('button', { name: 'Save template' }).click();
    await expect(sheet).not.toBeVisible({ timeout: 15_000 });

    const card = page.getByRole('listitem').filter({ hasText: title });
    await expect(card.getByText('1 subtask')).toBeVisible({ timeout: 15_000 });

    await card.getByRole('button', { name: title, exact: true }).click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Delete template' })
      .click();
    await page
      .getByRole('dialog', { name: `Delete “${title}”?` })
      .getByRole('button', { name: 'Delete template' })
      .click();
    await expect(card).toHaveCount(0, { timeout: 15_000 });
  });

  test('webhooks are off for the guest, and History lists what ran', async ({
    page,
  }) => {
    await section(page, /^Webhooks/).click();
    await expect(
      page.getByText(/Webhooks are off in the guest workspace/),
    ).toBeVisible();
    await expect(page.getByLabel('An example request')).toContainText(
      'X-TimeCraft-Signature',
    );
    await expect(page.getByRole('button', { name: 'Add webhook' })).toHaveCount(
      0,
    );

    await section(page, /^History/).click();
    await expect(page.getByText('Kept for 30 days')).toBeVisible();
    // nothing yet on a new board, or the days that something ran on
    await expect(
      page
        .getByText(/Nothing has run yet/)
        .or(page.getByRole('region').first()),
    ).toBeVisible({ timeout: 30_000 });
  });
});
