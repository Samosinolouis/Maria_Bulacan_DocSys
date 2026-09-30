import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('/Users/louis/Desktop/Maria_Bulacan_DocSys/wireframe/screenshots');
const ARTIFACT_DIR = path.resolve('/Users/louis/.gemini/antigravity-ide/brain/4bbfddf1-d4b2-442d-9126-7991e8b9ed10/wireframes');

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

async function run() {
  console.log('Launching browser for wireframe screenshot captures...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 960, deviceScaleFactor: 2 });

  const routes = [
    { name: '01-dashboard', path: '/dashboard.html' },
    { name: '02-incoming', path: '/incoming.html' },
    { name: '03-prepare', path: '/prepare.html' },
    { name: '04-review', path: '/review.html' },
    { name: '05-transmit', path: '/transmit.html' },
    { name: '06-archive', path: '/archive.html' },
    { name: '07-schedule', path: '/schedule.html' },
    { name: '08-reports', path: '/reports.html' },
    { name: '09-admin', path: '/admin.html' },
  ];

  for (const r of routes) {
    const url = `http://localhost:3005${r.path}`;
    console.log(`Capturing: ${r.name} from ${url}`);
    await page.goto(url, { waitUntil: 'networkidle0' });
    await new Promise((res) => setTimeout(res, 400));

    const filename = `wireframe-${r.name}.png`;
    const localPath = path.join(SCREENSHOT_DIR, filename);
    const artPath = path.join(ARTIFACT_DIR, filename);

    await page.screenshot({ path: localPath, fullPage: true });
    fs.copyFileSync(localPath, artPath);
    console.log(`Saved: ${filename}`);
  }

  // 10. Modal - Intake Docket
  console.log('Capturing: Modal Intake Docket...');
  await page.goto('http://localhost:3005/dashboard.html', { waitUntil: 'networkidle0' });
  await page.waitForSelector('button');
  // Click the intake button in the header
  const intakeBtn = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find((b) => b.textContent && b.textContent.includes('INTAKE DOCKET'));
  });
  if (intakeBtn) {
    await intakeBtn.click();
    await new Promise((res) => setTimeout(res, 500));
    const filename = 'wireframe-10-modal-intake.png';
    const localPath = path.join(SCREENSHOT_DIR, filename);
    const artPath = path.join(ARTIFACT_DIR, filename);
    await page.screenshot({ path: localPath });
    fs.copyFileSync(localPath, artPath);
    console.log(`Saved: ${filename}`);
  }

  // 11. Modal - Dossier Detail
  console.log('Capturing: Modal Dossier Detail...');
  await page.goto('http://localhost:3005/dashboard.html', { waitUntil: 'networkidle0' });
  await page.waitForSelector('button');
  const viewBtn = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find((b) => b.textContent && b.textContent.includes('[ View ]'));
  });
  if (viewBtn) {
    await viewBtn.click();
    await new Promise((res) => setTimeout(res, 500));
    const filename = 'wireframe-11-modal-dossier.png';
    const localPath = path.join(SCREENSHOT_DIR, filename);
    const artPath = path.join(ARTIFACT_DIR, filename);
    await page.screenshot({ path: localPath });
    fs.copyFileSync(localPath, artPath);
    console.log(`Saved: ${filename}`);
  }

  // 12. Modal - Routing Slip Preview
  console.log('Capturing: Modal Routing Slip...');
  await page.goto('http://localhost:3005/dashboard.html', { waitUntil: 'networkidle0' });
  await page.waitForSelector('button');
  const slipBtn = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find((b) => b.textContent && b.textContent.includes('[ Slip ]'));
  });
  if (slipBtn) {
    await slipBtn.click();
    await new Promise((res) => setTimeout(res, 500));
    const filename = 'wireframe-12-modal-routingslip.png';
    const localPath = path.join(SCREENSHOT_DIR, filename);
    const artPath = path.join(ARTIFACT_DIR, filename);
    await page.screenshot({ path: localPath });
    fs.copyFileSync(localPath, artPath);
    console.log(`Saved: ${filename}`);
  }

  // 13. Mobile Lockout Screen
  console.log('Capturing: Mobile Lockout Screen...');
  await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3005/dashboard.html', { waitUntil: 'networkidle0' });
  await new Promise((res) => setTimeout(res, 400));
  const filenameMobile = 'wireframe-13-mobile-lockout.png';
  const localPathMobile = path.join(SCREENSHOT_DIR, filenameMobile);
  const artPathMobile = path.join(ARTIFACT_DIR, filenameMobile);
  await page.screenshot({ path: localPathMobile });
  fs.copyFileSync(localPathMobile, artPathMobile);
  console.log(`Saved: ${filenameMobile}`);

  await browser.close();
  console.log('All wireframe screenshots successfully captured and stored!');
}

run().catch((err) => {
  console.error('Error during capture:', err);
  process.exit(1);
});
