import { chromium } from '/Users/rupesh/.gemini/antigravity/scratch/syllovo-studio/node_modules/playwright-core/index.mjs';
import fs from 'fs';

async function runTests() {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
      errors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.message);
    errors.push(err.message);
  });

  console.log('--- 1. Navigating to Portal (Desktop) ---');
  await page.goto('http://localhost:5173/portal.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // Screenshot Login Page
  await page.screenshot({ path: '/Users/rupesh/.gemini/antigravity/scratch/test_1_login_page.png' });
  console.log('1. Login page captured');

  // Test Admin Login with 2-Way MFA
  console.log('--- 2. Triggering Admin 2-Way MFA ---');
  await page.evaluate(() => {
    triggerAdmin2WayMFA('ADMIN', 'rupesh@fullstackmaster.net');
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/Users/rupesh/.gemini/antigravity/scratch/test_2_admin_mfa_modal.png' });
  console.log('2. Admin 2-Way MFA Modal captured');

  // Complete MFA
  await page.evaluate(() => {
    verifyAdminMFACode('842097');
  });
  await page.waitForTimeout(600);

  // Take Admin Cockpit Screenshot
  await page.screenshot({ path: '/Users/rupesh/.gemini/antigravity/scratch/test_3_admin_cockpit_white.png' });
  console.log('3. Admin Cockpit (Clean Minimalist Theme) captured');

  // Verify Yellow Reminder Box is crisp and readable
  const reminderLocator = page.locator('.at-reminder-amber');
  const reminderCount = await reminderLocator.count();
  console.log('Count of .at-reminder-amber:', reminderCount);
  if (reminderCount > 0) {
    const reminderText = await reminderLocator.first().textContent();
    console.log('Reminder text preview:', reminderText?.slice(0, 80));
  }

  // Check Directory Table Accrued to Date styling
  const accruedHeader = await page.locator('th:has-text("Accrued to Date")').first().getAttribute('class');
  console.log('Accrued to Date header class:', accruedHeader);

  // Verify Notification Bell
  console.log('--- 4. Testing Notification Bell & Approvals Hub ---');
  const bell = page.locator('#notificationBellContainer button');
  const bellVisible = await bell.isVisible();
  console.log('Notification bell visible:', bellVisible);

  await bell.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/Users/rupesh/.gemini/antigravity/scratch/test_4_notification_drawer.png' });
  console.log('4. Notification drawer captured');

  // Close modal
  await page.evaluate(() => closeDocModal());
  await page.waitForTimeout(300);

  // Test Admin Broadcast Modal
  console.log('--- 5. Testing Broadcast Modal ---');
  await page.evaluate(() => openAdminBroadcastModal());
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/Users/rupesh/.gemini/antigravity/scratch/test_5_broadcast_modal.png' });
  console.log('5. Broadcast modal captured');

  // Close modal
  await page.evaluate(() => closeDocModal());
  await page.waitForTimeout(300);

  // Switch to Staff (Ali - AAR-0008)
  console.log('--- 6. Testing Staff Portal (Ali Moulali) ---');
  await page.evaluate(() => {
    switchPersona('AAR-0008');
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: '/Users/rupesh/.gemini/antigravity/scratch/test_6_ali_staff_portal.png' });
  console.log('6. Ali Staff Portal captured');

  // Check UPI live feedback
  console.log('--- 7. Testing UPI Validation ---');
  const upiInput = page.locator('#staffUpiInput_AAR-0008');
  if (await upiInput.isVisible()) {
    await upiInput.fill('badupi');
    await page.evaluate(() => checkLiveUPIValidation('badupi', 'AAR-0008'));
    await page.waitForTimeout(200);
    const feedbackBad = await page.locator('#upiLiveFeedback_AAR-0008').textContent();
    console.log('UPI feedback on bad input:', feedbackBad);

    await upiInput.fill('shaik.ali@okaxis');
    await page.evaluate(() => checkLiveUPIValidation('shaik.ali@okaxis', 'AAR-0008'));
    await page.waitForTimeout(200);
    const feedbackGood = await page.locator('#upiLiveFeedback_AAR-0008').textContent();
    console.log('UPI feedback on good input:', feedbackGood);
  }

  // Test Mobile Simulator inside desktop app
  console.log('--- 8. Testing Mobile Simulator ---');
  await page.evaluate(() => {
    toggleMobileSimulator(true);
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: '/Users/rupesh/.gemini/antigravity/scratch/test_8_ali_mobile_sim.png' });
  console.log('8. Mobile Simulator captured');

  // Check Native Phone Screen (viewport 390x844 iPhone 14)
  console.log('--- 9. Testing Direct Native iPhone Viewport ---');
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await mobilePage.goto('http://localhost:5173/portal.html', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(500);
  await mobilePage.evaluate(() => {
    switchPersona('AAR-0008', false);
  });
  await mobilePage.waitForTimeout(600);
  await mobilePage.screenshot({ path: '/Users/rupesh/.gemini/antigravity/scratch/test_9_native_iphone_ali.png' });
  console.log('9. Native iPhone captured');

  // Measure overflow on mobile page
  const overflowCheck = await mobilePage.evaluate(() => {
    const docWidth = document.documentElement.offsetWidth;
    const bodyScrollWidth = document.body.scrollWidth;
    const overflowing = [];
    document.querySelectorAll('*').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.right > window.innerWidth + 2) {
        overflowing.push({
          tag: el.tagName,
          class: el.className ? el.className.slice(0, 50) : '',
          right: Math.round(rect.right),
          windowWidth: window.innerWidth
        });
      }
    });
    return { docWidth, bodyScrollWidth, windowWidth: window.innerWidth, overflowCount: overflowing.length, items: overflowing.slice(0, 5) };
  });
  console.log('Mobile overflow audit:', overflowCheck);

  await browser.close();
  console.log('=== ALL TESTS COMPLETED SUCCESSFULLY with', errors.length, 'console errors ===');
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
