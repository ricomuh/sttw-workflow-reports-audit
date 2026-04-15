import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://sttw-dev.leolitgames.com';
const SCREENSHOTS_DIR = '/home/ubuntu/siakad-sttw-audit/hrm/screenshots';
const ROUTES_FILE = '/tmp/siakad_audit_routes_hrm.json';

const CREDENTIALS = {
  developer: { email: 'developer@sttw.ac.id', password: 'password' },
  dosen: { email: 'dosen@sttw.ac.id', password: 'password' },
  tendik: { email: 'tendik@sttw.ac.id', password: 'password' },
  asesor: { email: 'asesor@sttw.ac.id', password: 'password' },
};

// Route -> role mapping
function getRoleForRoute(url) {
  if (url.startsWith('/hrm/admin')) return 'developer';
  if (url.startsWith('/hrm/asesor')) return 'asesor';
  if (url.startsWith('/hrm/laporan')) return 'developer';
  if (url.startsWith('/hrm/portal')) return 'dosen';
  if (url.startsWith('/hrm/tendik')) return 'tendik';
  return 'developer';
}

async function login(page, role) {
  const creds = CREDENTIALS[role];
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[name="email"]', creds.email);
  await page.fill('input[name="password"]', creds.password);
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  console.log(`Logged in as ${role} (${creds.email})`);
}

function isErrorPage(html, title) {
  if (html.includes('Whoops, looks like something went wrong') || 
      html.includes('500 | Server Error') ||
      html.includes('ErrorException') ||
      html.includes('IlluminateException') ||
      title.includes('500')) return '500';
  if (title.includes('404') || html.includes('404 | Not Found')) return '404';
  if (title.includes('403') || html.includes('403 | Forbidden') || html.includes('Periodo pengisian sudah tutup')) return '403';
  if (html.includes('419 | Page Expired')) return '419';
  return null;
}

function checkLayout(html) {
  const issues = [];
  // Check for breadcrumbs in content area
  if (!html.includes('breadcrumb') && !html.includes('Breadcrumb')) {
    issues.push('No breadcrumbs found');
  }
  // Check sidebar
  if (!html.includes('sidebar') && !html.includes('Sidebar')) {
    issues.push('No sidebar found');
  }
  // Navbar buttons check - look for action buttons in nav
  if (html.includes('<nav') && html.match(/<nav[^>]*>[\s\S]*?<button[\s\S]*?<\/nav>/)) {
    issues.push('Buttons may exist in navbar');
  }
  return issues;
}

async function main() {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  const routes = JSON.parse(fs.readFileSync(ROUTES_FILE, 'utf-8'));
  const results = [];

  const browser = await chromium.launch({ headless: true });
  
  // Group routes by role
  const byRole = {};
  for (const route of routes) {
    const role = getRoleForRoute(route.url);
    if (!byRole[role]) byRole[role] = [];
    byRole[role].push(route);
  }

  for (const [role, roleRoutes] of Object.entries(byRole)) {
    console.log(`\n=== Testing ${roleRoutes.length} routes as ${role} ===`);
    const context = await browser.newContext({ 
      viewport: { width: 1280, height: 900 },
      ignoreHTTPSErrors: true
    });
    const page = await context.newPage();
    
    try {
      await login(page, role);
    } catch(e) {
      console.log(`Login failed for ${role}: ${e.message}`);
      await context.close();
      continue;
    }

    for (const route of roleRoutes) {
      const url = BASE_URL + route.url;
      console.log(`Testing: ${route.url}`);
      
      let status = 200;
      let errorType = null;
      let layoutIssues = [];
      let notes = [];
      let screenshotPath = null;

      try {
        const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        status = response?.status() || 0;
        
        const html = await page.content();
        const title = await page.title();
        
        errorType = isErrorPage(html, title);
        
        if (!errorType) {
          layoutIssues = checkLayout(html);
        }

        // Check if redirected to login (session expired)
        const currentUrl = page.url();
        if (currentUrl.includes('/login')) {
          notes.push('Redirected to login - possible auth issue');
          status = 401;
        }

        // Screenshot
        const filename = route.name.replace(/[^a-z0-9_-]/gi, '_') + '.png';
        screenshotPath = path.join(SCREENSHOTS_DIR, filename);
        await page.screenshot({ path: screenshotPath, fullPage: false });

      } catch (e) {
        notes.push(`Error: ${e.message}`);
        errorType = 'TIMEOUT/ERROR';
      }

      results.push({
        name: route.name,
        url: route.url,
        role,
        status,
        errorType,
        layoutIssues,
        notes,
        screenshotPath: screenshotPath ? path.basename(screenshotPath) : null
      });
    }

    await context.close();
  }

  await browser.close();

  // Write JSON results
  fs.writeFileSync('/home/ubuntu/siakad-sttw-audit/hrm/results.json', JSON.stringify(results, null, 2));
  console.log(`\nDone! ${results.length} routes tested.`);
  console.log('Results saved to /home/ubuntu/siakad-sttw-audit/hrm/results.json');
  
  // Quick summary
  const errors = results.filter(r => r.errorType && r.errorType !== '403');
  const warnings = results.filter(r => r.layoutIssues?.length > 0);
  console.log(`\nSummary:`);
  console.log(`  Total: ${results.length}`);
  console.log(`  Errors (non-403): ${errors.length}`);
  console.log(`  Layout warnings: ${warnings.length}`);
  for (const e of errors) {
    console.log(`  ❌ ${e.url} [${e.errorType}] (role: ${e.role})`);
  }
}

main().catch(console.error);
