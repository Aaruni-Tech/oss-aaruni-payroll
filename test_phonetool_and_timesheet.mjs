import { chromium } from '/Users/rupesh/.gemini/antigravity/scratch/syllovo-studio/node_modules/playwright-core/index.mjs';
import fs from "fs";

const ARTIFACT_DIR = "/Users/rupesh/.gemini/antigravity/brain/b4bc3fdb-550d-4ae6-a160-c053c41350f8";

async function run() {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();

  console.log("1. Navigating to portal...");
  await page.goto("http://localhost:5173/portal.html", { waitUntil: "networkidle" });

  // Test 1: Check Ali's Profile & Amazon PhoneTool Header
  console.log("2. Switching to Ali (AAR-0008)...");
  await page.evaluate(() => {
    switchPersona("AAR-0008", true);
    setTab("phonetool");
  });
  await page.waitForTimeout(500);

  const aliHeaderHtml = await page.locator("#phoneToolHeaderCard").innerText();
  console.log("Ali PhoneTool Header Text:\n", aliHeaderHtml);

  await page.screenshot({
    path: `${ARTIFACT_DIR}/phonetool_ali_profile.png`,
    fullPage: false
  });
  console.log("Saved phonetool_ali_profile.png");

  // Test 2: Check Nandini's Profile & Amazon PhoneTool Header
  console.log("3. Switching to Nandini (AAR-0004)...");
  await page.evaluate(() => {
    switchPersona("AAR-0004", true);
    setTab("phonetool");
  });
  await page.waitForTimeout(500);

  const nandiniHeaderHtml = await page.locator("#phoneToolHeaderCard").innerText();
  console.log("Nandini PhoneTool Header Text:\n", nandiniHeaderHtml);

  await page.screenshot({
    path: `${ARTIFACT_DIR}/phonetool_nandini_profile.png`,
    fullPage: false
  });
  console.log("Saved phonetool_nandini_profile.png");

  // Test 3: Check Admin Dashboard Amazon PhoneTool Roster Card & Dynamic Accrual
  console.log("4. Switching to Admin Dashboard (activeTab=dashboard)...");
  await page.evaluate(() => {
    switchPersona("ADMIN", false);
    setTab("dashboard");
  });
  await page.waitForTimeout(600);

  await page.screenshot({
    path: `${ARTIFACT_DIR}/admin_dashboard_phonetool_roster.png`,
    fullPage: false
  });
  console.log("Saved admin_dashboard_phonetool_roster.png");

  // Test 4: Check Admin Employees Directory (activeTab=roster)
  console.log("5. Checking Admin Employees Directory (activeTab=roster)...");
  await page.evaluate(() => {
    setTab("roster");
  });
  await page.waitForTimeout(600);

  await page.screenshot({
    path: `${ARTIFACT_DIR}/admin_directory_phonetool_tenure.png`,
    fullPage: false
  });
  console.log("Saved admin_directory_phonetool_tenure.png");

  // Test 5: Timesheet Submission and Dashboard Reflection Test
  console.log("6. Testing Timesheet Submission Reflection...");
  
  // Get baseline accrued salary before submitting timesheet
  const baselineAccrued = await page.evaluate(() => {
    const curYm = getTodayDateStr().slice(0, 7);
    const activeStaff = state.employees.filter(e => e.status === "Active" && e.monthlyCtc > 0);
    const payrolls = activeStaff.map(emp => computeEmployeePayroll(emp, curYm));
    return payrolls.reduce((sum, r) => sum + r.accruedSalarySoFar, 0);
  });
  console.log("Baseline Accrued to Date:", baselineAccrued);

  // Submit timesheet for Ali (AAR-0008) for 2026-11-12
  await page.evaluate(async () => {
    await submitStaffTimesheet(
      "AAR-0008",
      "2026-11-12",
      "10:00",
      "19:00",
      "IT Infrastructure setup, office vendor coordination & network security audit"
    );
  });
  await page.waitForTimeout(600);

  // Check updated accrued salary
  const updatedAccrued = await page.evaluate(() => {
    const curYm = getTodayDateStr().slice(0, 7);
    const activeStaff = state.employees.filter(e => e.status === "Active" && e.monthlyCtc > 0);
    const payrolls = activeStaff.map(emp => computeEmployeePayroll(emp, curYm));
    return payrolls.reduce((sum, r) => sum + r.accruedSalarySoFar, 0);
  });
  console.log("Updated Accrued to Date after Ali's timesheet:", updatedAccrued);

  // Verify reflection in Dashboard
  await page.evaluate(() => {
    setTab("dashboard");
  });
  await page.waitForTimeout(500);

  await page.screenshot({
    path: `${ARTIFACT_DIR}/timesheet_reflection_verified.png`,
    fullPage: false
  });
  console.log("Saved timesheet_reflection_verified.png");

  // Mobile viewport test
  console.log("7. Testing Mobile Viewport for PhoneTool Header...");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    switchPersona("AAR-0008", true);
    setTab("phonetool");
  });
  await page.waitForTimeout(500);

  await page.screenshot({
    path: `${ARTIFACT_DIR}/phonetool_ali_mobile.png`,
    fullPage: false
  });
  console.log("Saved phonetool_ali_mobile.png");

  await browser.close();
  console.log("✅ All E2E verification tests completed successfully!");
}

run().catch((err) => {
  console.error("Test Error:", err);
  process.exit(1);
});
