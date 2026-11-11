#!/usr/bin/env python3

CSS_PATH = "/Users/rupesh/.gemini/antigravity/scratch/aaruni-payroll-repo/public/aaruni-brand.css"

with open(CSS_PATH, "r", encoding="utf-8") as f:
    css = f.read()

# Replace hardcoded navy sidebar and zoho names
old_section = """/* ========================================================================= */
/* ZOHO PAYROLL THEME & PERSISTENT NAVY SIDEBAR (EXACT MATCH TO ZOHO CLONE)  */
/* ========================================================================= */
.zoho-layout-container {
  display: flex;
  min-height: calc(100vh - 60px);
}

.zoho-sidebar {
  width: 240px;
  background-color: #182033 !important;
  color: #a6b0c3;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-right: 1px solid #232d46;
  position: sticky;
  top: 57px;
  height: calc(100vh - 57px);
  overflow-y: auto;
  z-index: 30;
}

.zoho-sidebar-brand {
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid #232d46;
}

.zoho-sidebar-nav {
  padding: 10px 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.zoho-nav-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 16px;
  margin: 1px 10px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #a6b0c3;
  cursor: pointer;
  transition: all 0.15s ease;
  border: none;
  background: transparent;
  width: calc(100% - 20px);
  text-align: left;
}

.zoho-nav-btn:hover {
  background-color: #232d46;
  color: #ffffff;
}

.zoho-nav-btn.active {
  background-color: #ff6b35 !important;
  color: #ffffff !important;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(255, 107, 53, 0.35);
}

.zoho-workspace {
  flex: 1;
  min-width: 0;
  background-color: #f8fafc;
  padding: 20px 24px;
}

[data-theme="dark"] .zoho-workspace {
  background-color: #090d16;
}

.zoho-top-search {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 16px;
  flex-wrap: wrap;
}

.zoho-search-input {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  color: #0f172a;
  border-radius: 8px;
  padding: 8px 14px 8px 36px;
  font-size: 13px;
  width: 320px;
  outline: none;
  transition: all 0.15s ease;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
}

[data-theme="dark"] .zoho-search-input {
  background-color: #0f172a;
  border-color: #1e293b;
  color: #ffffff;
}

.zoho-search-input:focus {
  border-color: #ff6b35;
  box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.15);
}

/* Zoho Peach Announcement Banner */
.zoho-peach-banner {
  background-color: #fff7ed;
  border: 1px solid #fed7aa;
  color: #9a3412;
  border-radius: 10px;
  padding: 12px 16px;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(254, 215, 170, 0.2);
}

[data-theme="dark"] .zoho-peach-banner {
  background-color: rgba(254, 95, 1, 0.1);
  border-color: rgba(254, 95, 1, 0.3);
  color: #fed7aa;
}

/* Zoho Pay Run Hero Card */
.zoho-payrun-card {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

[data-theme="dark"] .zoho-payrun-card {
  background-color: #0f172a;
  border-color: #1e293b;
}

.zoho-orange-btn {
  background-color: #ff6b35 !important;
  color: #ffffff !important;
  border: none;
  font-weight: 700;
  font-size: 13px;
  padding: 10px 22px;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(255, 107, 53, 0.35);
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.zoho-orange-btn:hover {
  background-color: #ea580c !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 107, 53, 0.45);
}

.zoho-sub-nav {
  display: flex;
  align-items: center;
  gap: 24px;
  border-bottom: 1.5px solid #e2e8f0;
  margin-bottom: 18px;
}

[data-theme="dark"] .zoho-sub-nav {
  border-color: #1e293b;
}

.zoho-sub-tab {
  font-size: 13px;
  font-weight: 700;
  padding: 8px 0;
  color: #64748b;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  background: transparent;
  border-top: none;
  border-left: none;
  border-right: none;
  transition: all 0.15s ease;
}

.zoho-sub-tab:hover {
  color: #ff6b35;
}

.zoho-sub-tab.active {
  color: #ff6b35;
  border-bottom-color: #ff6b35;
}"""

new_section = """/* ========================================================================= */
/* AARUNI ENTERPRISE HR LAYOUT & MINIMALIST EXECUTIVE WHITE THEME ENGINE    */
/* ========================================================================= */
.at-admin-layout,
.zoho-layout-container {
  display: flex;
  min-height: calc(100vh - 60px);
  background-color: var(--at-bg);
}

.at-sidebar,
.zoho-sidebar {
  width: 240px;
  background-color: var(--at-surface) !important;
  color: var(--at-text-secondary) !important;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-right: 1px solid var(--at-border) !important;
  position: sticky;
  top: 57px;
  height: calc(100vh - 57px);
  overflow-y: auto;
  z-index: 30;
  box-shadow: 1px 0 4px rgba(0, 0, 0, 0.03);
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.at-sidebar-brand,
.zoho-sidebar-brand {
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid var(--at-border) !important;
  background-color: var(--at-surface) !important;
}

.at-sidebar-nav,
.zoho-sidebar-nav {
  padding: 10px 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.at-nav-btn,
.zoho-nav-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 16px;
  margin: 1px 10px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--at-text-secondary) !important;
  cursor: pointer;
  transition: all 0.15s ease;
  border: none;
  background: transparent;
  width: calc(100% - 20px);
  text-align: left;
}

.at-nav-btn:hover,
.zoho-nav-btn:hover {
  background-color: var(--at-surface-subtle) !important;
  color: var(--at-text) !important;
}

.at-nav-btn.active,
.zoho-nav-btn.active {
  background: linear-gradient(135deg, #fe5f01 0%, #ea580c 100%) !important;
  color: #ffffff !important;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(254, 95, 1, 0.35);
}

.at-workspace,
.zoho-workspace {
  flex: 1;
  min-width: 0;
  background-color: var(--at-bg);
  padding: 20px 24px;
}

.at-top-search,
.zoho-top-search {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 16px;
  flex-wrap: wrap;
}

.at-search-input,
.zoho-search-input {
  background-color: var(--at-surface);
  border: 1px solid var(--at-border);
  color: var(--at-text);
  border-radius: 8px;
  padding: 8px 14px 8px 36px;
  font-size: 13px;
  width: 320px;
  outline: none;
  transition: all 0.15s ease;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
}

.at-search-input:focus,
.zoho-search-input:focus {
  border-color: #fe5f01;
  box-shadow: 0 0 0 3px rgba(254, 95, 1, 0.15);
}

/* Aaruni Announcement Banner */
.at-peach-banner,
.zoho-peach-banner {
  background-color: #fff7ed;
  border: 1px solid #fed7aa;
  color: #9a3412;
  border-radius: 10px;
  padding: 12px 16px;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(254, 215, 170, 0.2);
}

[data-theme="dark"] .at-peach-banner,
[data-theme="dark"] .zoho-peach-banner {
  background-color: rgba(254, 95, 1, 0.1);
  border-color: rgba(254, 95, 1, 0.3);
  color: #fed7aa;
}

/* Aaruni Pay Run Hero Card */
.at-payrun-card,
.zoho-payrun-card {
  background-color: var(--at-surface);
  border: 1px solid var(--at-border);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.at-orange-btn,
.zoho-orange-btn {
  background: linear-gradient(135deg, #fe5f01 0%, #ea580c 100%) !important;
  color: #ffffff !important;
  border: none;
  font-weight: 700;
  font-size: 13px;
  padding: 10px 22px;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(254, 95, 1, 0.35);
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.at-orange-btn:hover,
.zoho-orange-btn:hover {
  opacity: 0.95;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(254, 95, 1, 0.45);
}

.at-sub-nav,
.zoho-sub-nav {
  display: flex;
  align-items: center;
  gap: 24px;
  border-bottom: 1.5px solid var(--at-border);
  margin-bottom: 18px;
}

.at-sub-tab,
.zoho-sub-tab {
  font-size: 13px;
  font-weight: 700;
  padding: 8px 0;
  color: var(--at-text-muted);
  border-bottom: 2px solid transparent;
  cursor: pointer;
  background: transparent;
  border-top: none;
  border-left: none;
  border-right: none;
  transition: all 0.15s ease;
}

.at-sub-tab:hover,
.zoho-sub-tab:hover {
  color: #fe5f01;
}

.at-sub-tab.active,
.zoho-sub-tab.active {
  color: #fe5f01;
  border-bottom-color: #fe5f01;
}

/* ========================================================================= */
/* UNIVERSAL HIGH-CONTRAST CLEAN CLOSE BUTTONS                              */
/* ========================================================================= */
.at-btn-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background-color: var(--at-surface-subtle) !important;
  color: var(--at-text-secondary) !important;
  border: 1px solid var(--at-border) !important;
  font-weight: 700;
  font-size: 12px;
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.at-btn-close:hover {
  background-color: var(--at-surface-muted) !important;
  color: var(--at-text) !important;
  border-color: #cbd5e1 !important;
}

.at-modal-close-icon {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: var(--at-surface-subtle);
  color: var(--at-text-muted);
  border: 1px solid var(--at-border);
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.15s ease;
}
.at-modal-close-icon:hover {
  background-color: var(--at-surface-muted);
  color: var(--at-text);
  border-color: #cbd5e1;
}

/* High Contrast Yellow/Amber Reminder Box (Clean & 100% Readable) */
.at-reminder-amber {
  background-color: #fffbeb !important;
  border: 1.5px solid #f59e0b !important;
  color: #78350f !important;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(245, 158, 11, 0.1);
}
.at-reminder-amber .reminder-title {
  color: #9a3412 !important;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.at-reminder-amber .reminder-body {
  color: #1e293b !important;
  font-size: 12px;
}
.at-reminder-amber .reminder-highlight {
  color: #9a3412 !important;
  font-weight: 800;
}
.at-reminder-amber .reminder-btn {
  background-color: #ffffff !important;
  color: #9a3412 !important;
  border: 1px solid #fcd34d !important;
  font-weight: 700;
  padding: 6px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
.at-reminder-amber .reminder-btn:hover {
  background-color: #fef3c7 !important;
}

[data-theme="dark"] .at-reminder-amber {
  background-color: rgba(120, 53, 15, 0.25) !important;
  border-color: rgba(245, 158, 11, 0.4) !important;
  color: #fde68a !important;
}
[data-theme="dark"] .at-reminder-amber .reminder-title {
  color: #fbbf24 !important;
}
[data-theme="dark"] .at-reminder-amber .reminder-body {
  color: #f8fafc !important;
}
[data-theme="dark"] .at-reminder-amber .reminder-highlight {
  color: #fde68a !important;
}
[data-theme="dark"] .at-reminder-amber .reminder-btn {
  background-color: #1e293b !important;
  color: #fbbf24 !important;
  border-color: #78350f !important;
}"""

assert old_section in css, "old_section not found in aaruni-brand.css"
css = css.replace(old_section, new_section)

with open(CSS_PATH, "w", encoding="utf-8") as f:
    f.write(css)

print("SUCCESS: aaruni-brand.css patched with minimalist executive white styles & close button engine!")
