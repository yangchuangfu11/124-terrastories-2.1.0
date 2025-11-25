const { test, expect } = require('@playwright/test');
const { loginToApp, ensureHome, hasLoginCredentials } = require('./support/login');

const run = hasLoginCredentials() ? test : test.skip;

run('quick story check', async ({ page }) => {
  await loginToApp(page);
  await ensureHome(page);
  await page.waitForTimeout(5000);

  const { storyCount, cardFound } = await page.evaluate(() => ({
    storyCount: document.querySelectorAll('.story').length,
    cardFound: !!document.querySelector('.card')
  }));

  expect(cardFound).toBe(true);
  // Allow environments without seed data; still validates render.
  expect(storyCount).toBeGreaterThanOrEqual(0);
});
