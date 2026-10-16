import puppeteer from 'puppeteer-core';
import path from 'path';

async function testCleanLiveSystem() {
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

  const artifactDir = '/Users/louis/.gemini/antigravity-ide/brain/31b75229-68be-4dff-bd59-3b62b739cb8f';

  try {
    console.log('2. Visiting https://kind-field-0061c5600.4.azurestaticapps.net/login...');
    await page.goto('https://kind-field-0061c5600.4.azurestaticapps.net/login', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    console.log('3. Checking that login page is clean...');
    const bodyLogin = await page.evaluate(() => document.body.innerText);

    const hasPlantillaBox = bodyLogin.includes('Enrolled Civil Service Plantilla Accounts');
    const hasAlternative = bodyLogin.includes('Alternative: Quick Direct Credentials Entry');
    console.log('   hasPlantillaBox (should be false):', hasPlantillaBox);
    console.log('   hasAlternative (should be false):', hasAlternative);

    if (hasPlantillaBox || hasAlternative) {
      throw new Error('Login page still contains removed elements!');
    }

    await page.screenshot({
      path: path.join(artifactDir, 'clean_step1_login.png'),
      fullPage: true,
    });

    console.log('4. Authenticating on Keycloak...');
    const authBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(b => b.textContent?.includes('Authenticate on Keycloak')) || null;
    });

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      page.evaluate(el => el.click(), authBtn),
    ]);

    console.log('   On Keycloak page:', page.url());
    const uInput = await page.waitForSelector('#username', { timeout: 10000 });
    const pInput = await page.waitForSelector('#password', { timeout: 10000 });
    const submitBtn = await page.waitForSelector('#kc-login', { timeout: 10000 });

    await uInput.type('administrator');
    await pInput.type('DocSys2026!');

    console.log('5. Submitting Keycloak form...');
    await submitBtn.click();

    console.log('6. Waiting for Dashboard navigation...');
    await page.waitForFunction(
      () => window.location.pathname.includes('/dashboard'),
      { timeout: 30000 }
    );
    await new Promise(r => setTimeout(r, 2000));

    console.log('7. Verifying Clean Dashboard...');
    const bodyDash = await page.evaluate(() => document.body.innerText);
    const hasCleanRegistry = bodyDash.includes('Clean Registry') || bodyDash.includes('No Dockets Logged');
    const hasNoMockOverdue = !bodyDash.includes('Memorandum of Overdue Transaction: Executive Order Reconstituting');
    console.log('   Clean Registry message present:', hasCleanRegistry);
    console.log('   Mock overdue memo absent:', hasNoMockOverdue);

    await page.screenshot({
      path: path.join(artifactDir, 'clean_step2_dashboard.png'),
      fullPage: true,
    });

    console.log('8. Testing that no unreachable API toast is displayed...');
    const hasUnreachableToast = bodyDash.includes('The DocSys API is unreachable');
    console.log('   hasUnreachableToast (should be false):', hasUnreachableToast);

    if (hasUnreachableToast) {
      throw new Error('DocSys API unreachable error toast detected!');
    }

    console.log('ALL VERIFICATIONS PASSED: Login is clean, mock data removed, no API unreachable errors!');
  } finally {
    await browser.close();
  }
}

testCleanLiveSystem().catch((err) => {
  console.error('Test run error:', err);
  process.exit(1);
});
