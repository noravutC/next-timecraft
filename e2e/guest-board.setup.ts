import { test as setup } from '@playwright/test';
import { ensureBoard, signInAsGuest } from './guest';

// A fresh database (CI) has no guest board yet. Make it once, before the
// specs run in parallel, so none of them races to create it.
setup('guest workspace has a board', async ({ page }) => {
  await signInAsGuest(page);
  await ensureBoard(page);
});
