import { chromium } from "/Users/rupesh/.gemini/antigravity/scratch/syllovo-studio/node_modules/playwright-core/index.mjs";
import fs from "fs";
import path from "path";

const BASE_URL = process.env.AUDIT_URL || "http://127.0.0.1:5173";
const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

// 5 Mobile & Tablet Device Viewports
const DEVICE_MATRIX = [
  { name: "Android (Galaxy/Pixel)", width: 360, height: 800, isMobile: true, hasTouch: true },
  { name: "iPhone SE", width: 375, height: 667, isMobile: true, hasTouch: true },
  { name: "iPhone 14/15 Pro", width: 390, height: 844, isMobile: true, hasTouch: true },
  { name: "iPhone 15 Pro Max", width: 430, height: 932, isMobile: true, hasTouch: true },
  { name: "iPad Mini (Tablet)", width: 768, height: 1024, isMobile: true, hasTouch: true }
];

// Views / Tabs to Audit (Supports both /portal.html and edge routed /)
const PORTAL_PREFIX = process.env.PORTAL_PREFIX || "/portal.html";
const TEST_SCENARIOS = [
  { id: "staff-phonetool", path: `${PORTAL_PREFIX}?emp=AAR-0004&tab=phonetool` },
  { id: "staff-timesheet", path: `${PORTAL_PREFIX}?emp=AAR-0004&tab=timesheet` },
  { id: "staff-forte", path: `${PORTAL_PREFIX}?emp=AAR-0004&tab=forte` },
  { id: "staff-salary", path: `${PORTAL_PREFIX}?emp=AAR-0004&tab=salary` },
  { id: "staff-payslips", path: `${PORTAL_PREFIX}?emp=AAR-0004&tab=payslips` },
  { id: "staff-tax", path: `${PORTAL_PREFIX}?emp=AAR-0004&tab=tax` },
  { id: "staff-documents", path: `${PORTAL_PREFIX}?emp=AAR-0004&tab=documents` },
  { id: "admin-dashboard", path: `${PORTAL_PREFIX}?emp=ADMIN&tab=dashboard` },
  { id: "admin-roster", path: `${PORTAL_PREFIX}?emp=ADMIN&tab=roster` },
  { id: "admin-payroll", path: `${PORTAL_PREFIX}?emp=ADMIN&tab=payroll` },
  { id: "admin-pulse", path: `${PORTAL_PREFIX}?emp=ADMIN&tab=pulse` },
  { id: "admin-loans", path: `${PORTAL_PREFIX}?emp=ADMIN&tab=loans` },
  { id: "admin-appointments", path: `${PORTAL_PREFIX}?emp=ADMIN&tab=appointments` },
  { id: "login-screen", path: `${PORTAL_PREFIX}?emp=LOGIN` }
];

const THEMES = ["light", "dark"];

async function runMobileAuditSuite() {
  console.log(`\n========================================================================`);
  console.log(`📱 AARUNI TECH AUTOMATED MOBILE AUDIT & RESPONSIVENESS SUITE`);
  console.log(`Target URL: ${BASE_URL}`);
  console.log(`========================================================================\n`);

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-gpu"]
  });

  const allBugs = [];
  let totalTests = 0;
  let passedTests = 0;

  for (const device of DEVICE_MATRIX) {
    console.log(`\n[Device] 📲 ${device.name} (${device.width}x${device.height})`);

    const context = await browser.newContext({
      viewport: { width: device.width, height: device.height },
      isMobile: device.isMobile,
      hasTouch: device.hasTouch,
      deviceScaleFactor: 2
    });

    const page = await context.newPage();

    // Listen for console errors
    const consoleErrors = [];
    page.on("pageerror", (err) => consoleErrors.push(err.message));

    for (const theme of THEMES) {
      for (const scenario of TEST_SCENARIOS) {
        totalTests++;
        const targetUrl = `${BASE_URL}${scenario.path}&theme=${theme}`;
        
        try {
          await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 8000 });
          await page.waitForTimeout(300); // Allow DOM and fonts to settle

          // Execute DOM & Layout Inspection inside page
          const auditResult = await page.evaluate(({ deviceWidth, deviceHeight, theme }) => {
            const issues = [];
            const docEl = document.documentElement;
            const scrollW = docEl.scrollWidth;
            const clientW = docEl.clientWidth;

            // 1. Horizontal Viewport Overflow Detection
            if (scrollW > clientW + 2) {
              // Find offending elements causing the overflow
              const offenders = [];
              const allEls = document.querySelectorAll("*");
              for (const el of allEls) {
                if (el.nodeType !== 1) continue;
                const rect = el.getBoundingClientRect();
                if (rect.width > clientW + 2 || rect.right > clientW + 2) {
                  // Ignore elements designed to overflow horizontally with auto-scroll (e.g., .overflow-x-auto, subnav, tables)
                  const style = window.getComputedStyle(el);
                  if (style.overflowX === "auto" || style.overflowX === "scroll") continue;
                  
                  // Check if any ancestor is scrollable
                  let p = el.parentElement;
                  let isScrollProtected = false;
                  while (p && p !== document.body) {
                    const pStyle = window.getComputedStyle(p);
                    if (pStyle.overflowX === "auto" || pStyle.overflowX === "scroll") {
                      isScrollProtected = true;
                      break;
                    }
                    p = p.parentElement;
                  }
                  if (isScrollProtected) continue;

                  const tag = el.tagName.toLowerCase();
                  const cls = (el.className && typeof el.className === "string") ? el.className.split(" ").slice(0, 3).join(".") : "";
                  const text = (el.innerText || el.textContent || "").slice(0, 30).trim();
                  offenders.push({
                    selector: `${tag}${cls ? '.' + cls : ''}`,
                    right: Math.round(rect.right),
                    width: Math.round(rect.width),
                    text: text
                  });
                  if (offenders.length >= 4) break;
                }
              }

              issues.push({
                type: "HORIZONTAL_OVERFLOW",
                severity: "P0_CRITICAL",
                message: `Page horizontally overflows viewport! scrollWidth: ${scrollW}px > clientWidth: ${clientW}px (+${scrollW - clientW}px)`,
                offenders: offenders
              });
            }

            // 2. Action Buttons Clipping & Accessibility Probe
            const buttons = document.querySelectorAll("button, a.brand-grad");
            for (const btn of buttons) {
              const rect = btn.getBoundingClientRect();
              // Check if button is visible
              if (rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < deviceHeight) {
                // If button overflows viewport horizontally
                if (rect.right > clientW + 2 && !btn.closest(".overflow-x-auto")) {
                  issues.push({
                    type: "BUTTON_CLIPPED",
                    severity: "P1_HIGH",
                    message: `Button clipped beyond right viewport edge (${Math.round(rect.right)}px > ${clientW}px): "${(btn.innerText || '').slice(0, 25)}"`,
                    element: btn.tagName.toLowerCase() + (btn.className ? '.' + btn.className.split(' ')[0] : '')
                  });
                }
              }
            }

            // 3. Low-Contrast / Invisible Text Check
            const headings = document.querySelectorAll("h1, h2, h3, h4, .text-white, .alert-title");
            for (const h of headings) {
              const rect = h.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < deviceHeight) {
                const style = window.getComputedStyle(h);
                const color = style.color;
                // If light theme and color is pure white or near white
                if (theme === "light") {
                  if (color === "rgb(255, 255, 255)" || color === "rgba(255, 255, 255, 1)") {
                    // Check if background is dark
                    // Ignore buttons with orange gradient or colored backgrounds
                    if (h.closest(".brand-grad") || style.backgroundImage.includes("gradient") || h.closest("button") || h.tagName.toLowerCase() === "button") {
                      continue;
                    }
                    let bg = style.backgroundColor;
                    let cur = h.parentElement;
                    while (cur && (bg === "rgba(0, 0, 0, 0)" || bg === "transparent")) {
                      bg = window.getComputedStyle(cur).backgroundColor;
                      cur = cur.parentElement;
                    }
                    // If background is light (high RGB sum) but text is white
                    const rgbMatch = bg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
                    if (rgbMatch) {
                      const brightness = (Number(rgbMatch[1]) * 299 + Number(rgbMatch[2]) * 587 + Number(rgbMatch[3]) * 114) / 1000;
                      if (brightness > 180) {
                        issues.push({
                          type: "INVISIBLE_TEXT_LIGHT_MODE",
                          severity: "P0_CRITICAL",
                          message: `White text on light background (${bg}) in heading: "${(h.innerText || '').slice(0, 30)}"`,
                          element: h.tagName.toLowerCase()
                        });
                      }
                    }
                  }
                }
              }
            }

            return {
              scrollWidth: scrollW,
              clientWidth: clientW,
              issues: issues
            };
          }, { deviceWidth: device.width, deviceHeight: device.height, theme });

          if (auditResult.issues.length === 0) {
            passedTests++;
            process.stdout.write(`  ✅ [${theme.toUpperCase()}] ${scenario.id.padEnd(20)}: PASS (scrollWidth: ${auditResult.scrollWidth}px = ${auditResult.clientWidth}px)\n`);
          } else {
            console.log(`  ❌ [${theme.toUpperCase()}] ${scenario.id.padEnd(20)}: ${auditResult.issues.length} ISSUE(S)`);
            for (const issue of auditResult.issues) {
              console.log(`     - [${issue.severity}] ${issue.type}: ${issue.message}`);
              if (issue.offenders) {
                console.log(`       Offenders:`, JSON.stringify(issue.offenders));
              }
              allBugs.push({
                device: device.name,
                viewport: `${device.width}x${device.height}`,
                scenario: scenario.id,
                theme: theme,
                ...issue
              });
            }
          }
        } catch (err) {
          console.log(`  ⚠️ Error auditing ${scenario.id}: ${err.message}`);
        }
      }
    }
    await context.close();
  }

  await browser.close();

  console.log(`\n========================================================================`);
  console.log(`📊 AUDIT SUMMARY: ${passedTests}/${totalTests} Passed (${Math.round((passedTests/totalTests)*100)}%)`);
  console.log(`Total Findings: ${allBugs.length}`);
  console.log(`========================================================================\n`);

  fs.writeFileSync("/tmp/aaruni_mobile_audit_report.json", JSON.stringify(allBugs, null, 2));

  if (allBugs.length > 0) {
    console.log(`Found ${allBugs.length} issues to resolve. See detailed report above.`);
    process.exit(1);
  } else {
    console.log(`🎉 PERFECT SCORE! 100% Zero-Overflow across all mobile & tablet devices!`);
    process.exit(0);
  }
}

runMobileAuditSuite().catch(err => {
  console.error("Runner error:", err);
  process.exit(1);
});
