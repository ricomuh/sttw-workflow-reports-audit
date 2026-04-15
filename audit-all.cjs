// SIAKAD STTW Comprehensive Module Audit
// Runs Playwright against all target modules with correct role-based logins
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://sttw-dev.leolitgames.com';
const AUDIT_DIR = '/home/ubuntu/siakad-sttw-audit';

// Module configurations with role mapping
const MODULES = {
  hrm: {
    sections: [
      { prefix: 'hrm/admin', role: 'waket2', email: 'waket2@sttw.ac.id' },
      { prefix: 'hrm/laporan', role: 'waket2', email: 'waket2@sttw.ac.id' },
      { prefix: 'hrm/asesor', role: 'asesor', email: 'budi.santoso@sttw.ac.id' },
      { prefix: 'hrm/portal', role: 'dosen', email: 'budi.santoso@sttw.ac.id' },
      { prefix: 'hrm/tendik', role: 'tendik', email: 'rina.tendik@sttw.ac.id' },
    ]
  },
  p3m: {
    sections: [
      { prefix: 'p3m/admin', role: 'admin', email: 'admin@sttw.ac.id' },
      { prefix: 'p3m/dosen', role: 'dosen', email: 'budi.santoso@sttw.ac.id' },
    ]
  },
  lpm: {
    sections: [
      { prefix: 'lpm/admin', role: 'admin-lpm', email: 'admin-lpm@sttw.ac.id' },
      { prefix: 'lpm/auditor', role: 'auditor', email: 'auditor@sttw.ac.id' },
      { prefix: 'lpm/kaprodi', role: 'kaprodi', email: 'kaprodi@sttw.ac.id' },
      { prefix: 'lpm/portal', role: 'admin-lpm', email: 'admin-lpm@sttw.ac.id' },
    ]
  },
  pmb: {
    sections: [
      { prefix: 'siska/kemahasiswaan/pmb', role: 'admin-mhs', email: 'admin-mhs@sttw.ac.id' },
      { prefix: 'pmb', role: 'public', email: null }, // public pages
    ]
  },
  pkl: {
    sections: [
      { prefix: 'siska/pkl/registrations', role: 'admin', email: 'admin@sttw.ac.id' },
      { prefix: 'siska/pkl/monitoring', role: 'admin', email: 'admin@sttw.ac.id' },
      { prefix: 'siska/pkl/rekap-dosen', role: 'admin', email: 'admin@sttw.ac.id' },
      { prefix: 'siska/pkl/sidangs', role: 'admin', email: 'admin@sttw.ac.id' },
      { prefix: 'siska/pkl/unggah-mandiri-admin', role: 'admin', email: 'admin@sttw.ac.id' },
      { prefix: 'siska/pkl/logbooks', role: 'mahasiswa', email: 'mahasiswa@sttw.ac.id' },
      { prefix: 'siska/pkl/laporans', role: 'mahasiswa', email: 'mahasiswa@sttw.ac.id' },
      { prefix: 'siska/pkl/unggah-mandiri', role: 'mahasiswa', email: 'mahasiswa@sttw.ac.id' },
      { prefix: 'siska/dosen/pkl', role: 'dosen', email: 'dosen@sttw.ac.id' },
    ]
  },
  kkn: {
    sections: [
      { prefix: 'siska/kkn/periode', role: 'admin', email: 'admin@sttw.ac.id' },
      { prefix: 'siska/kkn/peserta', role: 'admin', email: 'admin@sttw.ac.id' },
      { prefix: 'siska/kkn/monitoring', role: 'admin', email: 'admin@sttw.ac.id' },
      { prefix: 'siska/kkn/rekap-dosen', role: 'admin', email: 'admin@sttw.ac.id' },
      { prefix: 'siska/kkn/seminar', role: 'admin', email: 'admin@sttw.ac.id' },
      { prefix: 'siska/kkn/unggah-mandiri-admin', role: 'admin', email: 'admin@sttw.ac.id' },
      { prefix: 'siska/kkn/mahasiswa', role: 'mahasiswa', email: 'mahasiswa@sttw.ac.id' },
      { prefix: 'siska/kkn/dpl', role: 'dosen', email: 'dosen@sttw.ac.id' },
      { prefix: 'siska/kkn', role: 'mahasiswa', email: 'mahasiswa@sttw.ac.id' }, // index
    ]
  },
  ta: {
    sections: [
      { prefix: 'siska/ta/admin', role: 'admin', email: 'admin@sttw.ac.id' },
      { prefix: 'siska/ta/monitoring', role: 'admin', email: 'admin@sttw.ac.id' },
      { prefix: 'siska/ta/rekap-dosen', role: 'admin', email: 'admin@sttw.ac.id' },
      { prefix: 'siska/ta/proposals-admin', role: 'admin', email: 'admin@sttw.ac.id' },
      { prefix: 'siska/ta/unggah-mandiri-admin', role: 'admin', email: 'admin@sttw.ac.id' },
      { prefix: 'siska/ta/dosen', role: 'dosen', email: 'dosen@sttw.ac.id' },
      { prefix: 'siska/ta/logbooks', role: 'mahasiswa', email: 'mahasiswa@sttw.ac.id' },
      { prefix: 'siska/ta/proposals', role: 'mahasiswa', email: 'mahasiswa@sttw.ac.id' },
      { prefix: 'siska/ta/sidangs', role: 'mahasiswa', email: 'mahasiswa@sttw.ac.id' },
      { prefix: 'siska/ta/unggah-mandiri', role: 'mahasiswa', email: 'mahasiswa@sttw.ac.id' },
    ]
  },
  skripsi: {
    sections: [
      { prefix: 'siska/skripsi/admin', role: 'admin', email: 'admin@sttw.ac.id' },
      { prefix: 'siska/skripsi/monitoring', role: 'admin', email: 'admin@sttw.ac.id' },
      { prefix: 'siska/skripsi/rekap-dosen', role: 'admin', email: 'admin@sttw.ac.id' },
      { prefix: 'siska/skripsi/proposals-admin', role: 'admin', email: 'admin@sttw.ac.id' },
      { prefix: 'siska/skripsi/unggah-mandiri-admin', role: 'admin', email: 'admin@sttw.ac.id' },
      { prefix: 'siska/skripsi/dosen', role: 'dosen', email: 'dosen@sttw.ac.id' },
      { prefix: 'siska/skripsi/logbooks', role: 'mahasiswa', email: 'mahasiswa@sttw.ac.id' },
      { prefix: 'siska/skripsi/proposals', role: 'mahasiswa', email: 'mahasiswa@sttw.ac.id' },
      { prefix: 'siska/skripsi/sidangs', role: 'mahasiswa', email: 'mahasiswa@sttw.ac.id' },
      { prefix: 'siska/skripsi/unggah-mandiri', role: 'mahasiswa', email: 'mahasiswa@sttw.ac.id' },
    ]
  },
};

async function login(page, email) {
  // First logout if already logged in
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 10000 });
    const url = page.url();
    if (!url.includes('/login')) {
      // Already logged in, need to logout
      await page.goto(`${BASE_URL}/logout`, { waitUntil: 'domcontentloaded', timeout: 5000 }).catch(() => {});
      // POST to logout
      await page.evaluate(async () => {
        const token = document.querySelector('meta[name="csrf-token"]')?.content;
        if (token) {
          await fetch('/logout', { method: 'POST', headers: { 'X-CSRF-TOKEN': token, 'Content-Type': 'application/json' } });
        }
      }).catch(() => {});
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 10000 });
    }
  } catch(e) {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 10000 });
  }

  await page.fill('input[name="login"]', email);
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  
  const currentUrl = page.url();
  if (currentUrl.includes('/login')) {
    throw new Error(`Login failed for ${email}`);
  }
  return true;
}

function detectErrors(html, status) {
  const errors = [];
  if (status >= 500) errors.push({ type: 'HTTP_500', msg: `HTTP ${status} Server Error` });
  if (status === 404) errors.push({ type: 'HTTP_404', msg: 'HTTP 404 Not Found' });
  if (status === 403) errors.push({ type: 'HTTP_403', msg: 'HTTP 403 Forbidden' });
  if (status === 401) errors.push({ type: 'HTTP_401', msg: 'HTTP 401 Unauthorized' });
  
  if (html.includes('Whoops, looks like something went wrong') || html.includes('Server Error'))
    errors.push({ type: 'LARAVEL_ERROR', msg: 'Laravel error page detected' });
  if (html.includes('ErrorException') || html.includes('QueryException') || html.includes('Illuminate\\'))
    errors.push({ type: 'LARAVEL_EXCEPTION', msg: 'Laravel exception visible' });
  
  return errors;
}

function checkLayout(html) {
  const issues = [];
  
  // Check breadcrumbs
  const hasBreadcrumb = html.includes('breadcrumb') || html.includes('x-breadcrumb') || 
                         html.includes('aria-label="breadcrumb"') || html.includes('Breadcrumb');
  if (!hasBreadcrumb) issues.push({ type: 'NO_BREADCRUMB', msg: 'No breadcrumbs found' });
  
  // Check sidebar
  const hasSidebar = html.includes('sidebar') || html.includes('x-sidebar') || html.includes('nav-sidebar');
  if (!hasSidebar) issues.push({ type: 'NO_SIDEBAR', msg: 'No sidebar found' });
  
  return issues;
}

function checkDummyData(html) {
  // Check if tables have data (not empty state messages)
  const hasNoData = html.includes('Belum ada data') || html.includes('Tidak ada data') || 
                    html.includes('No data') || html.includes('Data tidak ditemukan') ||
                    html.includes('Belum ada entri');
  const hasTable = html.includes('<table') || html.includes('<tbody');
  const hasTableRows = (html.match(/<tr/g) || []).length > 2; // more than header row
  
  return {
    hasNoData,
    hasTable,
    hasTableRows,
    populated: hasTable ? hasTableRows : null
  };
}

// Get the target module from CLI args
const TARGET_MODULE = process.argv[2];
if (!TARGET_MODULE || !MODULES[TARGET_MODULE]) {
  console.error(`Usage: node audit-all.cjs <module>`);
  console.error(`Available: ${Object.keys(MODULES).join(', ')}`);
  process.exit(1);
}

const moduleConfig = MODULES[TARGET_MODULE];
const routesFile = `/tmp/routes_${TARGET_MODULE}.json`;

(async () => {
  const routes = JSON.parse(fs.readFileSync(routesFile, 'utf8'));
  const ssDir = path.join(AUDIT_DIR, TARGET_MODULE, 'screenshots');
  fs.mkdirSync(ssDir, { recursive: true });
  
  const browser = await chromium.launch({ headless: true });
  const results = [];
  let currentEmail = null;
  let context = null;
  let page = null;
  
  // Group routes by section/role
  for (const route of routes) {
    const uri = route.uri;
    
    // Skip parameterized routes for now (we'll handle index pages)
    if (uri.includes('{')) continue;
    
    // Skip export/download routes
    if (uri.includes('/export') || uri.includes('/download') || uri.includes('/pdf')) continue;
    
    // Find the right section for this route
    let section = null;
    let longestMatch = 0;
    for (const s of moduleConfig.sections) {
      if (uri.startsWith(s.prefix) && s.prefix.length > longestMatch) {
        section = s;
        longestMatch = s.prefix.length;
      }
    }
    
    if (!section) {
      // Try developer fallback
      section = { prefix: '', role: 'developer', email: 'developer@sttw.ac.id' };
    }
    
    // Login if needed
    if (section.email !== currentEmail) {
      if (context) await context.close();
      context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        ignoreHTTPSErrors: true
      });
      page = await context.newPage();
      
      if (section.email) {
        try {
          await login(page, section.email);
          currentEmail = section.email;
          console.log(`✓ Logged in as ${section.email} (${section.role})`);
        } catch(e) {
          console.log(`✗ Login failed for ${section.email}: ${e.message}`);
          currentEmail = null;
          continue;
        }
      } else {
        currentEmail = null;
        console.log(`→ Public access (no login)`);
      }
    }
    
    // Visit the route
    const ssName = uri.replace(/\//g, '_').replace(/^_/, '') + '.png';
    const ssPath = path.join(ssDir, ssName);
    
    try {
      console.log(`  Testing: ${uri} (${section.role})...`);
      const resp = await page.goto(`${BASE_URL}/${uri}`, {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });
      
      await page.waitForTimeout(1000); // let JS render
      
      const status = resp?.status() || 0;
      const html = await page.content();
      const title = await page.title();
      
      const errors = detectErrors(html, status);
      const layoutIssues = checkLayout(html);
      const dataCheck = checkDummyData(html);
      
      await page.screenshot({ path: ssPath, fullPage: true });
      
      const result = {
        uri,
        name: route.name,
        role: section.role,
        email: section.email,
        status,
        errors,
        layoutIssues,
        dataCheck,
        hasErrors: errors.length > 0,
        screenshot: ssName
      };
      
      results.push(result);
      
      const icon = errors.length > 0 ? '❌' : (layoutIssues.length > 0 ? '⚠️' : '✅');
      const errMsg = errors.length > 0 ? errors.map(e => e.msg).join(', ') : 'OK';
      console.log(`  ${icon} ${uri}: ${status} - ${errMsg}`);
      
    } catch(e) {
      const result = {
        uri,
        name: route.name,
        role: section.role,
        email: section.email,
        status: 0,
        errors: [{ type: 'NAV_ERROR', msg: e.message.split('\n')[0] }],
        layoutIssues: [],
        dataCheck: {},
        hasErrors: true,
        screenshot: null
      };
      results.push(result);
      console.log(`  ❌ ${uri}: Navigation error - ${e.message.split('\n')[0]}`);
    }
  }
  
  if (context) await context.close();
  await browser.close();
  
  // Write results
  const resultsPath = path.join(AUDIT_DIR, TARGET_MODULE, 'audit-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  
  // Summary
  const total = results.length;
  const errCount = results.filter(r => r.hasErrors).length;
  const warnCount = results.filter(r => !r.hasErrors && r.layoutIssues.length > 0).length;
  const okCount = total - errCount - warnCount;
  
  console.log(`\n=== ${TARGET_MODULE.toUpperCase()} AUDIT SUMMARY ===`);
  console.log(`Total: ${total} | ✅ OK: ${okCount} | ⚠️ Warnings: ${warnCount} | ❌ Errors: ${errCount}`);
  
  if (errCount > 0) {
    console.log('\nErrors:');
    results.filter(r => r.hasErrors).forEach(r => {
      console.log(`  ${r.uri} (${r.role}): ${r.errors.map(e => e.msg).join(', ')}`);
    });
  }
})();
