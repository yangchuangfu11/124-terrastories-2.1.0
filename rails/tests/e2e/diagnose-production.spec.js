const { test, expect } = require('@playwright/test');
const fs = require('fs');
const { loginToApp, ensureHome, hasLoginCredentials } = require('./support/login');

const run = hasLoginCredentials() ? test : test.skip;

run('diagnose production app data', async ({ page }) => {
  // Login
  await loginToApp(page);
  await ensureHome(page);

  await page.waitForTimeout(2000);

  // Take screenshot of authenticated state
  await page.screenshot({ path: '/tmp/authenticated-home.png', fullPage: true });

  // Capture the React props JSON
  const propsJson = await page.evaluate(() => {
    const appDiv = document.querySelector('[data-react-component="App"]');
    if (!appDiv) return { error: 'No App component found' };

    const propsAttr = appDiv.getAttribute('data-react-props');
    if (!propsAttr) return { error: 'No data-react-props attribute' };

    try {
      return JSON.parse(propsAttr);
    } catch (e) {
      return { error: 'Failed to parse JSON', raw: propsAttr.substring(0, 500) };
    }
  });

  // Save to file
  fs.writeFileSync('/tmp/production-props.json', JSON.stringify(propsJson, null, 2));
  console.log('Props saved to /tmp/production-props.json');

  // Get CSS/asset info
  const assetInfo = await page.evaluate(() => {
    const info = {
      stylesheets: [],
      images: [],
      errors: []
    };

    // Check stylesheets
    document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
      info.stylesheets.push({
        href: link.href,
        loaded: link.sheet !== null
      });
    });

    // Check images
    document.querySelectorAll('img').forEach(img => {
      info.images.push({
        src: img.src,
        complete: img.complete,
        naturalHeight: img.naturalHeight,
        alt: img.alt
      });
    });

    // Check for console errors (captured during page load)
    return info;
  });

  fs.writeFileSync('/tmp/production-assets.json', JSON.stringify(assetInfo, null, 2));
  console.log('Asset info saved to /tmp/production-assets.json');

  // Check if Card component rendered
  const cardInfo = await page.evaluate(() => {
    const card = document.querySelector('[class*="Card"], .card, .cardContainer');
    if (!card) return { found: false };

    const styles = window.getComputedStyle(card);
    return {
      found: true,
      className: card.className,
      display: styles.display,
      visibility: styles.visibility,
      innerHTML: card.innerHTML.substring(0, 500)
    };
  });

  fs.writeFileSync('/tmp/production-card.json', JSON.stringify(cardInfo, null, 2));
  console.log('Card info saved to /tmp/production-card.json');

  console.log('\n=== DIAGNOSTIC SUMMARY ===');
  console.log('Props keys:', Object.keys(propsJson).join(', '));
  if (propsJson.stories) {
    console.log('Stories count:', propsJson.stories.length);
    if (propsJson.stories.length > 0) {
      console.log('First story keys:', Object.keys(propsJson.stories[0]).join(', '));
      if (propsJson.stories[0].media) {
        console.log('First story media count:', propsJson.stories[0].media.length);
      }
    }
  }
  console.log('Card found:', cardInfo.found);
  console.log('Stylesheets loaded:', assetInfo.stylesheets.filter(s => s.loaded).length, '/', assetInfo.stylesheets.length);

  expect(cardInfo.found).toBe(true);
  expect(assetInfo.stylesheets.length).toBeGreaterThan(0);
});
