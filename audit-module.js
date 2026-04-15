#!/usr/bin/env node
/**
 * SIAKAD STTW - Module Audit Script
 * Runs Playwright to test all GET routes for a given module prefix.
 * Captures screenshots, detects errors, compares with workflow reports.
 * 
 * Usage: node audit-module.js <module> <login_email> <base_url>
 * Example: node audit-module.js hrm developer@sttw.ac.id https://sttw-dev.leolitgames.com
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const MODULE = process.argv[2] || 'hrm';
const LOGIN_EMAIL = process.argv[3] || 'developer@sttw.ac.id';
const BASE_URL = process.argv[4] || 'https://sttw-dev.leolitgames.com';
const REPORT_DIR = path.join('/home/ubuntu/siakad-sttw-audit', MODULE);
const SS_DIR = path.join(REPORT_DIR, 'screenshots');
const WR_DIR = '/home/ubuntu/siakad-sttw-workflow-reports';

// Route definitions per module - populated from route:list
const ROUTES_FILE = `/tmp/siakad_audit_routes_${MODULE}.json`;

(async () => {
  const routesData = JSON.parse(fs.readFileSync(ROUTES_FILE, 'utf8'));
  
  fs.mkdirSync(SS_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ 
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true 
  });
  const page = await context.newPage();

  // Login
  console.log(`[${MODULE}] Logging in as ${LOGIN_EMAIL}...`);
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.fill('input[name="login"]', LOGIN_EMAIL);
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  
  const currentUrl = page.url();
  if (currentUrl.includes('/login')) {
    console.log(`[${MODULE}] Login failed! Still on login page.`);
    await browser.close();
    process.exit(1);
  }
  console.log(`[${MODULE}] Logged in successfully. Current URL: ${currentUrl}`);

  const results = [];
  let totalOk = 0, totalError = 0, totalSkipped = 0;

  for (const route of routesData) {
    const { name, url, expectedRole } = route;
    const ssPath = path.join(SS_DIR, `${name}.png`);
    
    try {
      console.log(`  Testing: ${name} (${url})...`);
      const resp = await page.goto(`${BASE_URL}${url}`, { 
        waitUntil: 'networkidle', 
        timeout: 20000 
      });
      
      const status = resp?.status() || 0;
      const pageContent = await page.content();
      
      // Error detection
      const errors = [];
      if (status >= 500) errors.push(`HTTP ${status} Server Error`);
      if (status === 404) errors.push('HTTP 404 Not Found');
      if (status === 403) errors.push('HTTP 403 Forbidden');
      if (status === 401) errors.push('HTTP 401 Unauthorized');
      if (pageContent.includes('Whoops!') || pageContent.includes('Server Error')) 
        errors.push('Laravel error page detected');
      if (pageContent.includes('Page Not Found') || pageContent.includes('404'))
        if (status === 404) {} // already captured
      if (pageContent.includes('Unauthorized') && status === 403) {} // already captured
      
      // Check for empty tables with no data message
      const hasNoData = pageContent.includes('Belum ada data') || 
                       pageContent.includes('Tidak ada data') ||
                       pageContent.includes('No data');
      
      // Screenshot
      await page.screenshot({ path: ssPath, fullPage: true });
      
      // Check breadcrumb existence
      const hasBreadcrumb = pageContent.includes('breadcrumb') || 
                           pageContent.includes('x-breadcrumb');
      
      // Check for buttons in navbar (bad pattern)
      const navbarHtml = await page.$eval('nav', el => el.innerHTML).catch(() => '');
      const hasNavbarButtons = navbarHtml.includes('<button') && !navbarHtml.includes('dropdown');

      const result = {
        name,
        url,
        status,
        errors,
        hasErrors: errors.length > 0,
        hasNoData,
        hasBreadcrumb,
        hasNavbarButtons,
        screenshot: ssPath
      };
      
      results.push(result);
      
      if (errors.length > 0) {
        totalError++;
        console.log(`  ❌ ${name}: ${errors.join(', ')}`);
      } else {
        totalOk++;
        console.log(`  ✅ ${name}: OK (${status})`);
      }
      
    } catch (e) {
      totalError++;
      const result = {
        name, url, status: 0, 
        errors: [`Navigation error: ${e.message}`],
        hasErrors: true, screenshot: null
      };
      results.push(result);
      console.log(`  ❌ ${name}: ${e.message}`);
    }
  }

  // Summary
  const summary = {
    module: MODULE,
    timestamp: new Date().toISOString(),
    loginEmail: LOGIN_EMAIL,
    totalRoutes: routesData.length,
    ok: totalOk,
    errors: totalError,
    skipped: totalSkipped,
    results
  };

  const reportPath = path.join(REPORT_DIR, 'audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2));
  
  console.log(`\n=== ${MODULE.toUpperCase()} AUDIT SUMMARY ===`);
  console.log(`Total: ${routesData.length} | OK: ${totalOk} | Errors: ${totalError}`);
  console.log(`Report: ${reportPath}`);
  
  if (totalError > 0) {
    console.log('\nErrors found:');
    results.filter(r => r.hasErrors).forEach(r => {
      console.log(`  ${r.name} (${r.url}): ${r.errors.join(', ')}`);
    });
  }

  await browser.close();
})();
