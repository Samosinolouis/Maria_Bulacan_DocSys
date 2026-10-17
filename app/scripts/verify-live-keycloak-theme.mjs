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
  console.log('Navigating to live Keycloak auth endpoint:', authUrl);
  await page.goto(authUrl, { waitUntil: 'networkidle2', timeout: 45000 });

  const title = await page.title();
  console.log('Page Title:', title);

  const screenshotDesktop = path.join(ARTIFACT_DIR, 'azure_live_keycloak_theme_desktop.png');
  await page.screenshot({ path: screenshotDesktop, fullPage: true });
  console.log('Saved desktop screenshot to:', screenshotDesktop);

  // Switch to mobile viewport
  await page.setViewport({ width: 390, height: 844 });
  const screenshotMobile = path.join(ARTIFACT_DIR, 'azure_live_keycloak_theme_mobile.png');
  await page.screenshot({ path: screenshotMobile, fullPage: true });
  console.log('Saved mobile screenshot to:', screenshotMobile);

  // Switch back to desktop for login test
  await page.setViewport({ width: 1440, height: 900 });
  console.log('Filling in credentials on Keycloak...');
  await page.type('#username', 'administrator');
  await page.type('#password', 'DocSys2026!');
  
  const screenshotFilled = path.join(ARTIFACT_DIR, 'azure_live_keycloak_filled.png');
  await page.screenshot({ path: screenshotFilled, fullPage: true });
  console.log('Saved filled form screenshot to:', screenshotFilled);

  console.log('Clicking Sign In...');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
    page.click('#kc-login')
  ]);

  console.log('Current URL after login:', page.url());
  const screenshotAfterLogin = path.join(ARTIFACT_DIR, 'azure_live_post_login.png');
  await page.screenshot({ path: screenshotAfterLogin, fullPage: true });
  console.log('Saved post-login screenshot to:', screenshotAfterLogin);

  await browser.close();
  console.log('Verification script completed successfully.');
}

main().catch(err => {
  console.error('Error during verification:', err);
  process.exit(1);
});
