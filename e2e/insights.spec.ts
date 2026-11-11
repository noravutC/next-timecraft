import { expect, test } from '@playwright/test';
import { ensureBoard, signInAsGuest } from './guest';

test.describe('insights', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsGuest(page);
    await ensureBoard(page);
    await page.getByRole('radio', { name: 'Insights' }).click();
  });

  test('shows the board as numbers, and the view is kept in the link', async ({
    page,
  }) => {
    await expect(page).toHaveURL(/view=insights/);
    // every board in the suite has a Done column, so the tiles are there;
    // the charts below them wait for the first finished task
    await expect(page.getByText('Not finished yet')).toBeVisible({
      timeout: 30_000,
    });
    const charts = page.getByRole('region', {
      name: 'New and finished tasks',
    });
    const nothingYet = page.getByRole('heading', {
      name: 'Nothing finished yet',
    });
    await expect(charts.or(nothingYet)).toBeVisible();

    await page.reload();
    await expect(page.getByRole('radio', { name: 'Insights' })).toBeChecked();
    await expect(page.getByText('Not finished yet')).toBeVisible({
      timeout: 30_000,
    });
  });

  test('the period switches between 4 and 12 weeks', async ({ page }) => {
    const period = page.getByRole('radiogroup', { name: 'Period' });
    await expect(period.getByRole('radio', { name: '12 weeks' })).toBeChecked();
    await period.getByRole('radio', { name: '4 weeks' }).click();
    await expect(period.getByRole('radio', { name: '4 weeks' })).toBeChecked();
    await expect(page.getByText('Not finished yet')).toBeVisible({
      timeout: 30_000,
    });
  });

  test('the guest sees the weekly digest but cannot turn it on', async ({
    page,
  }) => {
    await page.getByRole('button', { name: /weekly digest/i }).click();
    await expect(
      page.getByRole('heading', { name: 'Weekly digest' }),
    ).toBeVisible();
    await expect(
      page.getByRole('switch', { name: 'Email it to me' }),
    ).toBeDisabled();
    await expect(
      page.getByRole('link', { name: 'See an example' }),
    ).toBeVisible();
  });
});
