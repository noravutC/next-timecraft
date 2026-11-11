import { test as setup } from '@playwright/test';
import { ensureBoard, saveGuestSession } from './guest';

// A fresh database (CI) has no guest board yet. Make it once, before the
// specs run in parallel, so none of them races to create it. The session is
// saved here too: see signInAsGuest.
setup('guest workspace has a board', async ({ page }) => {
  await saveGuestSession(page);
  await ensureBoard(page);
});
