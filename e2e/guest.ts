import { existsSync, readFileSync } from 'node:fs';
import { expect, type Locator, type Page } from '@playwright/test';

/** The guest session saved by the setup project (test-results is gitignored). */
export const GUEST_STATE = 'test-results/.auth/guest.json';

const signInThroughLogin = async (page: Page) => {
  await page.goto('/login');
  await page.getByRole('button', { name: /continue as guest/i }).click();
  await page.waitForURL(/\/project/, { timeout: 30_000 });
};

/**
 * Guest sign-in is throttled to 10 a minute per IP, fewer than the suite has
 * tests. So only the setup project goes through /login; the specs reuse the
 * session it saved, and fall back to /login if that session is not accepted.
 */
export const signInAsGuest = async (page: Page) => {
  if (existsSync(GUEST_STATE)) {
    const { cookies } = JSON.parse(readFileSync(GUEST_STATE, 'utf8'));
    await page.context().addCookies(cookies);
    await page.goto('/project');
    if (/\/project/.test(page.url())) return;
  }
  await signInThroughLogin(page);
};

/** Sign in through /login and save the session for the specs. */
export const saveGuestSession = async (page: Page) => {
  await signInThroughLogin(page);
  await page.context().storageState({ path: GUEST_STATE });
};

/** Guest workspace may or may not already have a board (a fresh DB has none). */
export const ensureBoard = async (page: Page) => {
  const column = page.getByTestId('board-column').first();
  const firstBoard = page.getByRole('heading', {
    name: /create your first board/i,
  });
  await expect(column.or(firstBoard)).toBeVisible({ timeout: 30_000 });

  if (await firstBoard.isVisible()) {
    // Kanban Board is preselected
    await page.getByLabel('Board name').fill('E2E Board');
    await page.getByRole('button', { name: /^create board/i }).click();
  }
  await expect(column).toBeVisible({ timeout: 30_000 });
};

/**
 * Clear a card away through its menu (Archive task) and wait for the server
 * to confirm. The card hides optimistically, so without waiting the test can
 * end (and close the page) before the PATCH lands, leaving e2e cards on the
 * shared guest board.
 */
export const deleteCard = async (page: Page, card: Locator) => {
  await card.hover();
  await card.getByRole('button', { name: 'Task actions' }).click();
  const deleted = page.waitForResponse(
    (r) =>
      r.request().method() === 'PATCH' &&
      r.url().includes('/api/task/') &&
      r.ok(),
    { timeout: 15_000 },
  );
  await page.getByRole('menuitem', { name: /archive task/i }).click();
  await deleted;
  await expect(card).not.toBeVisible({ timeout: 15_000 });
};
