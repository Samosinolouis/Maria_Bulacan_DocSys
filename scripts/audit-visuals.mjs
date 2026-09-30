import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const ARTIFACTS_DIR = path.resolve('/Users/louis/.gemini/antigravity-ide/brain/4bbfddf1-d4b2-442d-9126-7991e8b9ed10');
const OUTPUT_DIR = path.join(ARTIFACTS_DIR, 'visual_audits');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function runAudit() {
  console.log('🚀 Starting Zero-Key Visual Audit with Puppeteer on http://localhost:3000...');
  
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // 1. Audit Desktop 1440px Viewport
  console.log('\n--- Auditing Desktop Viewport (1440x900) ---');
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

  const desktopScreenshot = path.join(OUTPUT_DIR, 'desktop-1440px.png');
  await page.screenshot({ path: desktopScreenshot, fullPage: false });
  console.log(`Saved desktop screenshot to ${desktopScreenshot}`);

  // Inspect computed styles & overflow on desktop
  const desktopMetrics = await page.evaluate(() => {
    const scrollW = document.documentElement.scrollWidth;
    const clientW = document.documentElement.clientWidth;
    const hasHorizontalOverflow = scrollW > clientW;
    
    // Check logos
    const images = Array.from(document.querySelectorAll('img')).map(img => ({
      src: img.src,
      alt: img.alt,
      width: img.naturalWidth,
      height: img.naturalHeight,
      complete: img.complete
    }));

    // Check emojis in DOM text
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{26FF}]/u;
    const textContent = document.body.innerText;
    const emojisFound = textContent.match(new RegExp(emojiRegex, 'gu')) || [];

    // Check em-dashes and en-dashes (taste-skill Section 9.G)
    const emDashesFound = textContent.match(/[—–]/g) || [];

    return {
      scrollWidth: scrollW,
      clientWidth: clientW,
      hasHorizontalOverflow,
      images,
      emojisFoundCount: emojisFound.length,
      emojisFound,
      emDashesFoundCount: emDashesFound.length,
      emDashesFound
    };
  });

  console.log('Desktop Layout Results:', JSON.stringify(desktopMetrics, null, 2));

  // 2. Audit Mobile 375px Viewport
  console.log('\n--- Auditing Mobile Viewport (375x812 - iPhone / Personnel Field View) ---');
  await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 });
  await page.reload({ waitUntil: 'networkidle0' });

  const mobileScreenshot = path.join(OUTPUT_DIR, 'mobile-375px.png');
  await page.screenshot({ path: mobileScreenshot, fullPage: false });
  console.log(`Saved mobile screenshot to ${mobileScreenshot}`);

  const mobileMetrics = await page.evaluate(() => {
    const scrollW = document.documentElement.scrollWidth;
    const clientW = document.documentElement.clientWidth;
    return {
      scrollWidth: scrollW,
      clientWidth: clientW,
      hasHorizontalOverflow: scrollW > clientW
    };
  });
  console.log('Mobile Layout Results:', JSON.stringify(mobileMetrics, null, 2));

  // 3. Test New Intake Modal in Desktop Viewport
  console.log('\n--- Auditing Modal Interaction in Desktop Viewport ---');
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.reload({ waitUntil: 'networkidle0' });

  // Click New Document Intake button
  const intakeBtn = await page.$('button[title*="kahilingan"]');
  if (intakeBtn) {
    await intakeBtn.click();
    await new Promise(r => setTimeout(r, 600)); // wait for modal animation
    const modalScreenshot = path.join(OUTPUT_DIR, 'modal-intake-1440px.png');
    await page.screenshot({ path: modalScreenshot, fullPage: false });
    console.log(`Saved modal screenshot to ${modalScreenshot}`);
  }

  await browser.close();
  console.log('\n✅ Visual audit complete. All screenshots captured.');
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
