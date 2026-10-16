import puppeteer from 'puppeteer';

async function testLiveKeycloakLogin() {
  console.log('Launching browser to test live Keycloak authentication on Azure...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    console.log('Navigating to https://kind-field-0061c5600.4.azurestaticapps.net/login...');
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    page.on('requestfailed', req => console.log('REQ FAILED:', req.url(), req.failure()?.errorText));

    await page.goto('https://kind-field-0061c5600.4.azurestaticapps.net/login', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    await page.screenshot({ path: 'scripts/screenshots/01-live-login-page.png' });
    console.log('Screenshot 01: Login page loaded.');

    // Check inputs
    const usernameInput = await page.$('input[placeholder*="administrator"]');
    const passwordInput = await page.$('input[type="password"]');
    const submitBtn = await page.$('button[type="submit"]');

    if (!usernameInput || !passwordInput || !submitBtn) {
      throw new Error('Keycloak login form inputs not found!');
    }

    console.log('Filling credentials: administrator / DocSys2026!...');
    // Clear and type
    await usernameInput.click({ clickCount: 3 });
    await usernameInput.type('administrator');
    await passwordInput.click({ clickCount: 3 });
    await passwordInput.type('DocSys2026!');

    console.log('Submitting Keycloak authentication form...');
    await submitBtn.click();

    // Wait for navigation or url to change to dashboard
    console.log('Waiting for redirection to /dashboard...');
    await page.waitForFunction(() => window.location.pathname.includes('/dashboard'), {
      timeout: 20000,
    });

    console.log('Successfully reached /dashboard!');
    await page.waitForFunction(() => document.body.innerText.includes('Clemente') || document.body.innerText.includes('ADMINISTRATOR'), {
      timeout: 10000,
    });

    await page.screenshot({ path: 'scripts/screenshots/02-live-dashboard-authenticated.png' });
    console.log('Screenshot 02: Dashboard loaded with Keycloak authenticated user.');

    // Read user details from header/page
    const pageText = await page.evaluate(() => document.body.innerText);
    const hasClemente = pageText.includes('Clemente');
    const hasAdmin = pageText.includes('Administrator') || pageText.includes('ADMINISTRATOR');
    console.log('Verification checks:');
    console.log('- User Name displayed:', hasClemente);
    console.log('- Role / Position displayed:', hasAdmin);

    if (hasClemente) {
      console.log('\n--- LIVE KEYCLOAK AUTHENTICATION TEST PASSED! ---');
    } else {
      console.warn('Dashboard loaded but user text check differed.');
    }
  } finally {
    await browser.close();
  }
}

testLiveKeycloakLogin().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
