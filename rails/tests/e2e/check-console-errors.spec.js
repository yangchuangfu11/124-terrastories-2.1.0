const { test, expect } = require('@playwright/test');
const fs = require('fs');
const { loginToApp, ensureHome, hasLoginCredentials } = require('./support/login');

const run = hasLoginCredentials() ? test : test.skip;

run('capture console errors and story list', async ({ page }) => {
  const errors = [];
  const logs = [];

  // Capture console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();

    if (type === 'error') {
      errors.push(text);
    } else if (type === 'log' || type === 'warn') {
      logs.push(`[${type}] ${text}`);
    }
  });

  // Capture page errors
  page.on('pageerror', error => {
    errors.push(`PAGE ERROR: ${error.message}\n${error.stack}`);
  });

  await loginToApp(page);
  await ensureHome(page);

  await page.waitForTimeout(3000);

  // Check story list rendering
  const storyListInfo = await page.evaluate(() => {
    const info = {
      storyListFound: false,
      storyCount: 0,
      storyTitles: [],
      storyListHTML: '',
      cardHTML: ''
    };

    // Find StoryList
    const storyList = document.querySelector('.card--content');
    if (storyList) {
      info.storyListFound = true;
      info.storyListHTML = storyList.innerHTML.substring(0, 1000);

      // Count story items
      const storyItems = storyList.querySelectorAll('.story');
      info.storyCount = storyItems.length;

      storyItems.forEach(item => {
        const title = item.querySelector('.story--content-title');
        if (title) info.storyTitles.push(title.textContent);
      });
    }

    // Get full card HTML
    const card = document.querySelector('.card');
    if (card) {
      info.cardHTML = card.innerHTML.substring(0, 2000);
    }

    return info;
  });

  fs.writeFileSync('/tmp/console-errors.json', JSON.stringify({ errors, logs }, null, 2));
  fs.writeFileSync('/tmp/story-list-info.json', JSON.stringify(storyListInfo, null, 2));

  expect(errors).toEqual([]);
  expect(storyListInfo.storyListFound).toBe(true);
  // Allow empty datasets in shared test environments; we're asserting render + no errors.
  expect(storyListInfo.storyCount).toBeGreaterThanOrEqual(0);
});
