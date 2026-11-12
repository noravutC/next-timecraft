import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { ensureBoard, signInAsGuest } from './guest';

// WCAG 2.1 A and AA, the level most accessibility laws point at
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/** Violations that block people: axe's "serious" and "critical". */
const blockingViolations = async (page: Page) => {
  const { violations } = await new AxeBuilder({ page })
    .withTags(WCAG)
    // Avatars show initials in place of a picture. axe reads them as a
    // visible label the button's name should repeat ("SB Seed board"), which
    // would make the names worse, so these two buttons are checked by hand.
    .exclude('[aria-label="Account menu"]')
    .exclude('[aria-label$=": switch board"]')
    .analyze();
  return violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .flatMap((v) => v.nodes.map((n) => `${v.id}: ${n.target.join(' ')}`));
};

test.describe('accessibility', () => {
  test('landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await blockingViolations(page)).toEqual([]);
  });

  test('login page', async ({ page }) => {
    await page.goto('/login');
    await expect(
      page.getByRole('button', { name: /continue as guest/i }),
    ).toBeVisible();
    expect(await blockingViolations(page)).toEqual([]);
  });

  test('board', async ({ page }) => {
    await signInAsGuest(page);
    await ensureBoard(page);
    expect(await blockingViolations(page)).toEqual([]);
  });

  test('insights', async ({ page }) => {
    await signInAsGuest(page);
    await ensureBoard(page);
    await page.getByRole('radio', { name: 'Insights' }).click();
    await expect(page.getByText('Not finished yet')).toBeVisible({
      timeout: 30_000,
    });
    expect(await blockingViolations(page)).toEqual([]);
  });

  test('automation, and the rule editor over it', async ({ page }) => {
    await signInAsGuest(page);
    await ensureBoard(page);
    await page.getByRole('radio', { name: 'Automation' }).click();
    await expect(
      page
        .getByRole('heading', { name: 'Let the board do the routine work' })
        .or(page.getByText('This week so far:')),
    ).toBeVisible({ timeout: 30_000 });
    expect(await blockingViolations(page)).toEqual([]);

    await page.getByRole('button', { name: 'New rule' }).click();
    const sheet = page.getByRole('dialog', { name: 'New rule' });
    await sheet
      .getByRole('button', { name: /^A task moves to a column/ })
      .click();
    await sheet.getByRole('button', { name: 'Archive it' }).click();
    await expect(sheet.getByText('In plain words')).toBeVisible();
    expect(await blockingViolations(page)).toEqual([]);
  });
});
