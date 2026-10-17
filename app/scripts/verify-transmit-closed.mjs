import puppeteer from 'puppeteer';
import path from 'path';

const ARTIFACT_DIR = '/Users/louis/.gemini/antigravity-ide/brain/31b75229-68be-4dff-bd59-3b62b739cb8f';

async function main() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const authUrl = 'https://santamaria-docsys-idp.azurewebsites.net/realms/docsys/protocol/openid-connect/auth?client_id=docsys-app&response_type=token%20id_token&scope=openid%20profile%20email&redirect_uri=https://kind-field-0061c5600.4.azurestaticapps.net/login&nonce=12345&prompt=login';
  console.log('Navigating to live Keycloak auth endpoint...');
  await page.goto(authUrl, { waitUntil: 'networkidle2', timeout: 45000 });

  console.log('Logging in on Keycloak as administrator...');
  await page.waitForSelector('#username', { timeout: 15000 });
  await page.type('#username', 'administrator');
  await page.type('#password', 'DocSys2026!');
  
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
    page.click('#kc-login')
  ]);

  console.log('Logged in. Current URL:', page.url());

  // Navigate to /transmit
  console.log('Navigating to /transmit...');
  await page.goto('https://kind-field-0061c5600.4.azurestaticapps.net/transmit', {
    waitUntil: 'networkidle2',
    timeout: 30000
  });

  await new Promise((r) => setTimeout(r, 2000));

  // Extract visible rows in the municipal-docket-table
  const tableData = await page.evaluate(() => {
    const table = document.querySelector('table.municipal-docket-table');
    if (!table) return { exists: false, rows: [] };
    const rows = Array.from(table.querySelectorAll('tbody tr')).map(tr => {
      const cells = Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim());
      return cells;
    });
    return { exists: true, rows };
  });

  console.log('Transmit table data:', JSON.stringify(tableData, null, 2));

  const screenshotPath = path.join(ARTIFACT_DIR, 'live_transmit_view_verified.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log('Saved screenshot to:', screenshotPath);

  await browser.close();
  console.log('Verification completed successfully.');
}

main().catch(err => {
  console.error('Error during verification:', err);
  process.exit(1);
});
