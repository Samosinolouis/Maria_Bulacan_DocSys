import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

async function testLiveUpload() {
  console.log('Launching browser to test live upload on Azure...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    page.on('console', (msg) => {
      console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
    });

    page.on('requestfailed', (req) => {
      console.log(`[REQUEST FAILED] ${req.method()} ${req.url()} - ${req.failure()?.errorText}`);
    });

    page.on('response', (res) => {
      if (res.url().includes('upload') || res.status() >= 400) {
        console.log(`[RESPONSE] ${res.status()} ${res.url()}`);
      }
    });

    console.log('1. Navigating to login...');
    await page.goto('https://kind-field-0061c5600.4.azurestaticapps.net/login', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    console.log('2. Finding login button...');
    const authBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(b => b.textContent?.includes('Authenticate') || b.textContent?.includes('Keycloak') || b.textContent?.includes('Log In') || b.textContent?.includes('Sign In')) || null;
    });

    if (!authBtn) {
      console.log('Available buttons:', await page.evaluate(() => Array.from(document.querySelectorAll('button')).map(b => b.textContent)));
      throw new Error('No authenticate button found');
    }

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      page.evaluate(el => el.click(), authBtn),
    ]);

    console.log('3. On page:', page.url());
    if (page.url().includes('santamaria-docsys-idp')) {
      console.log('   Filling Keycloak login...');
      const uInput = await page.waitForSelector('#username', { timeout: 10000 });
      const pInput = await page.waitForSelector('#password', { timeout: 10000 });
      const submitBtn = await page.waitForSelector('#kc-login', { timeout: 10000 });

      await uInput.type('administrator');
      await pInput.type('DocSys2026!');

      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
        submitBtn.click(),
      ]);
    }

    console.log('4. Redirected to:', page.url());
    await page.waitForFunction(() => window.location.pathname.includes('/dashboard'), {
      timeout: 20000,
    });
    console.log('   Authenticated successfully.');

    console.log('5. Navigating to /incoming...');
    await page.goto('https://kind-field-0061c5600.4.azurestaticapps.net/incoming', {
      waitUntil: 'networkidle2',
      timeout: 20000,
    });

    console.log('6. Clicking Log New Incoming button...');
    const logBtn = await page.waitForSelector('button::-p-text(Log New Incoming), button::-p-text(Log Incoming Document)', { timeout: 10000 });
    await logBtn.click();

    console.log('7. Waiting for intake modal...');
    await page.waitForSelector('input[name="title"], input[placeholder*="e.g."]', { timeout: 10000 });

    const testPdfPath = path.resolve('/tmp/test-sample.pdf');
    fs.writeFileSync(testPdfPath, '%PDF-1.4\n%âãÏÓ\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000015 00000 n \n0000000060 00000 n \n0000000111 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF');

    page.on('request', (req) => {
      if (req.url().includes('upload') || req.url().includes('graphql')) {
        console.log(`[REQUEST] ${req.method()} ${req.url()}`);
      }
    });

    console.log('8. Filling intake fields...');
    const titleInput = await page.waitForSelector('input[placeholder*="Travel Order"]');
    const partyInput = await page.waitForSelector('input[placeholder*="Florian"]');
    const officeInput = await page.waitForSelector('input[placeholder*="Disaster"]');

    await titleInput.type('Official Test Letter with Live Upload');
    await partyInput.type('Barangay Poblacion Council');
    await officeInput.type('Office of the Barangay Captain');

    console.log('9. Attaching test PDF...');
    const fileInput = await page.waitForSelector('input[type="file"]');
    await fileInput.uploadFile(testPdfPath);
    await page.evaluate((el) => {
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, fileInput);
    console.log('   File attached and change event dispatched.');

    console.log('10. Submitting intake form...');
    const submitRecordBtn = await page.waitForSelector('button[type="submit"]', { timeout: 5000 });
    await submitRecordBtn.click();

    console.log('11. Waiting to observe upload behavior...');
    await new Promise((r) => setTimeout(r, 8000));

    const pageText = await page.evaluate(() => document.body.innerText);
    console.log('--- Result ---');
    console.log('Has "The upload service is unreachable":', pageText.includes('The upload service is unreachable'));
    console.log('Has "Logged into Municipal Records":', pageText.includes('Logged into Municipal Records'));
    console.log('Has "failed" / "Failed":', pageText.includes('failed') || pageText.includes('Failed'));
    if (pageText.includes('failed') || pageText.includes('The upload service is unreachable')) {
      console.log('Modal text:', pageText.slice(0, 1000));
    }

  } finally {
    await browser.close();
  }
}

testLiveUpload().catch((err) => {
  console.error('Error during test:', err);
  process.exit(1);
});
