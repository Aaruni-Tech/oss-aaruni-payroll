import { chromium } from '/Users/rupesh/.gemini/antigravity/scratch/syllovo-studio/node_modules/playwright-core/index.mjs';

async function testJanviAndDates() {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('BROWSER ERROR:', msg.text());
  });

  console.log('--- 1. Navigating to Local Portal ---');
  await page.goto('http://localhost:5173/portal.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // Switch to Janhavi (AAR-0005)
  console.log('--- 2. Switching to Janhavi Varma (AAR-0005) ---');
  await page.evaluate(() => {
    switchPersona('AAR-0005');
  });
  await page.waitForTimeout(800);

  // Check date string in the Timesheet Punch Box
  const punchBoxText = await page.locator('.timesheet-punch-box').first().textContent();
  console.log('Punch Box text preview:\n', punchBoxText.trim().replace(/\s+/g, ' ').slice(0, 200));

  const tsDateValue = await page.locator('#tsDate').inputValue();
  console.log('Visible #tsDate input value:', tsDateValue);

  // Take screenshot of Janhavi profile on desktop
  await page.screenshot({ path: '/Users/rupesh/.gemini/antigravity/brain/b4bc3fdb-550d-4ae6-a160-c053c41350f8/verify_janvi_desktop_today.png' });
  console.log('Screenshot verify_janvi_desktop_today.png captured');

  // Check Attendance Tab for Janhavi
  console.log('--- 3. Checking Janhavi Attendance Tab ---');
  await page.evaluate(() => setTab('timesheet'));
  await page.waitForTimeout(600);
  await page.screenshot({ path: '/Users/rupesh/.gemini/antigravity/brain/b4bc3fdb-550d-4ae6-a160-c053c41350f8/verify_janvi_attendance_tab.png' });
  console.log('Screenshot verify_janvi_attendance_tab.png captured');

  // Test Mobile view for Janhavi
  console.log('--- 4. Checking Native Phone View for Janhavi (iPhone 14) ---');
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await mobilePage.goto('http://localhost:5173/portal.html', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(500);
  await mobilePage.evaluate(() => {
    switchPersona('AAR-0005', false);
  });
  await mobilePage.waitForTimeout(600);
  await mobilePage.screenshot({ path: '/Users/rupesh/.gemini/antigravity/brain/b4bc3fdb-550d-4ae6-a160-c053c41350f8/verify_janvi_mobile_today.png' });
  console.log('Screenshot verify_janvi_mobile_today.png captured');

  // Check Admin Cockpit Attendance Pulse
  console.log('--- 5. Checking Admin Cockpit Attendance Pulse ---');
  await page.evaluate(() => {
    switchPersona('ADMIN', false);
    setTab('pulse');
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: '/Users/rupesh/.gemini/antigravity/brain/b4bc3fdb-550d-4ae6-a160-c053c41350f8/verify_admin_pulse_today.png' });
  console.log('Screenshot verify_admin_pulse_today.png captured');

  await browser.close();
  console.log('=== VERIFICATION COMPLETED ===');
}

testJanviAndDates().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
