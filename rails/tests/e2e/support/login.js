const fs = require('fs');
const path = require('path');

const LOGIN_INPUT = 'input[type="text"], input[type="email"]';
const PASSWORD_INPUT = 'input[type="password"]';
const ENTER_SITE_SELECTOR = 'button:has-text("Enter Site"), a:has-text("Enter Site")';

const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const RAILS_ROOT = path.resolve(__dirname, '..', '..', '..');

const ENV_FILES = [
  path.join(RAILS_ROOT, '.env.playwright'),
  path.join(RAILS_ROOT, '.env'),
  path.join(PROJECT_ROOT, '.env.playwright'),
  path.join(PROJECT_ROOT, '.env')
];

let envLoaded = false;

function parseEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    content.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const match = trimmed.match(/^([A-Z0-9_\.\-]+)\s*=\s*(.*)$/i);
      if (!match) return;
      const key = match[1];
      let value = match[2];

      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      value = value.replace(/\\n/g, '\n').replace(/\\r/g, '\r');

      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    });
  } catch (error) {
    // Ignore file read errors to allow optional env files.
  }
}

function loadEnvFilesOnce() {
  if (envLoaded) return;
  ENV_FILES.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      parseEnvFile(filePath);
    }
  });
  envLoaded = true;
}

function requireEnv(name) {
  loadEnvFilesOnce();
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing Playwright login env var: ${name}`);
  }
  return value;
}

function hasLoginCredentials() {
  loadEnvFilesOnce();
  return ['PLAYWRIGHT_LOGIN_URL', 'PLAYWRIGHT_LOGIN_USERNAME', 'PLAYWRIGHT_LOGIN_PASSWORD']
    .every(key => !!process.env[key]);
}

function getLoginCredentials() {
  return {
    url: requireEnv('PLAYWRIGHT_LOGIN_URL'),
    username: requireEnv('PLAYWRIGHT_LOGIN_USERNAME'),
    password: requireEnv('PLAYWRIGHT_LOGIN_PASSWORD')
  };
}

async function loginToApp(page) {
  const { url, username, password } = getLoginCredentials();

  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const status = response ? `${response.status()} ${response.statusText()}` : 'No response';

  if (!response || !response.ok()) {
    throw new Error(`Failed to load login page (${status}). Check PLAYWRIGHT_LOGIN_URL.`);
  }

  const content = await page.content();
  if (/no such app/i.test(content) || /there's nothing here/i.test(content)) {
    throw new Error('Login page returned Heroku "No such app" page. Verify PLAYWRIGHT_LOGIN_URL.');
  }

  const usernameInput = page.locator(LOGIN_INPUT).first();
  const passwordInput = page.locator(PASSWORD_INPUT).first();

  await usernameInput.waitFor({ state: 'visible', timeout: 5000 });
  await passwordInput.waitFor({ state: 'visible', timeout: 5000 });

  await usernameInput.fill(username);
  await passwordInput.fill(password);

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle' }),
    page.locator('button, input[type="submit"]').first().click()
  ]);
}

async function ensureHome(page) {
  if (page.url().includes('/home')) {
    return;
  }

  const enterButton = page.locator(ENTER_SITE_SELECTOR).first();
  if (await enterButton.count()) {
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }),
      enterButton.click()
    ]);
  }

  await page.waitForURL('**/home', { timeout: 20000 });
}

module.exports = { getLoginCredentials, loginToApp, ensureHome, hasLoginCredentials };
