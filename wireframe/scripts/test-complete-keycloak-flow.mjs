import puppeteer from 'puppeteer-core';
import path from 'path';

async function testCompleteKeycloakFlow() {
  console.log('1. Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  page.on('console', (msg) => {
    console.log(`[PAGE LOG] ${msg.text()}`);
  });
  page.on('pageerror', (err) => {
    console.error(`[PAGE ERROR]`, err.message);
  });

  const artifactDir = '/Users/louis/.gemini/antigravity-ide/brain/31b75229-68be-4dff-bd59-3b62b739cb8f';

  try {
    console.log('2. Navigating to https://kind-field-0061c5600.4.azurestaticapps.net/login...');
    await page.goto('https://kind-field-0061c5600.4.azurestaticapps.net/login', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    console.log('3. Taking screenshot of login page...');
    await page.screenshot({
      path: path.join(artifactDir, 'keycloak_step1_login_desk.png'),
      fullPage: true,
    });

    console.log('4. Locating "Authenticate on Keycloak" button...');
    const authBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(b => b.textContent?.includes('Authenticate on Keycloak')) || null;
    });

    const isBtnFound = await page.evaluate(el => !!el, authBtn);
    if (!isBtnFound) {
      throw new Error('Could not find "Authenticate on Keycloak" button on login page');
    }

    console.log('5. Clicking "Authenticate on Keycloak"...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      authBtn.click(),
    ]);

    console.log('6. Current URL after click:', page.url());
    console.log('7. Page Title:', await page.title());
    await page.screenshot({
      path: path.join(artifactDir, 'keycloak_step2_keycloak_screen.png'),
      fullPage: true,
    });

    if (!page.url().includes('santamaria-docsys-idp.azurewebsites.net')) {
      throw new Error(`Expected Keycloak URL, got: ${page.url()}`);
    }

    console.log('8. Entering credentials into Keycloak form...');
    const usernameInput = await page.waitForSelector('#username', { timeout: 10000 });
    const passwordInput = await page.waitForSelector('#password', { timeout: 10000 });
    const kcSubmitBtn = await page.waitForSelector('#kc-login', { timeout: 10000 });

    await usernameInput.type('administrator');
    await passwordInput.type('DocSys2026!');

    console.log('9. Submitting Keycloak credentials form...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      kcSubmitBtn.click(),
    ]);

    console.log('10. Current URL after Keycloak redirect:', page.url());

    // Wait for the app to parse the hash and land on dashboard
    console.log('11. Waiting for dashboard navigation...');
    await page.waitForFunction(
      () => window.location.pathname.includes('/dashboard'),
      { timeout: 20000 }
    );

    console.log('12. Landed on:', page.url());
    // Give dashboard time to render
    await new Promise(r => setTimeout(r, 2000));

    await page.screenshot({
      path: path.join(artifactDir, 'keycloak_step3_authenticated_dashboard.png'),
      fullPage: true,
    });

    const pageContent = await page.evaluate(() => document.body.innerText);
    const hasElmer = pageContent.includes('Elmer') || pageContent.includes('Clemente') || pageContent.includes('Administrator');
    console.log('13. Contains Elmer / Municipal Administrator session info:', hasElmer);

    console.log('SUCCESS: Keycloak OIDC authentication flow completed end-to-end on Azure!');
  } finally {
    await browser.close();
  }
}

testCompleteKeycloakFlow().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
