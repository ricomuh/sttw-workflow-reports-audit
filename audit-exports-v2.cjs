// SIAKAD STTW Export/Download Audit v2
// Properly handles download interception
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://sttw-dev.leolitgames.com';
const AUDIT_DIR = '/home/ubuntu/siakad-sttw-audit/exports';
const SS_DIR = path.join(AUDIT_DIR, 'screenshots');
const DL_DIR = path.join(AUDIT_DIR, 'downloads');
fs.mkdirSync(SS_DIR, { recursive: true });
fs.mkdirSync(DL_DIR, { recursive: true });

const EXPORT_ROUTES = [
  { uri: 'hrm/laporan/dosen/export', role: 'waket2', email: 'waket2@sttw.ac.id', desc: 'HRM Laporan Dosen Excel' },
  { uri: 'hrm/laporan/dosen/export-pdf', role: 'waket2', email: 'waket2@sttw.ac.id', desc: 'HRM Laporan Dosen PDF' },
  { uri: 'hrm/laporan/tendik/export', role: 'waket2', email: 'waket2@sttw.ac.id', desc: 'HRM Laporan Tendik Excel' },
  { uri: 'hrm/laporan/tendik/export-pdf', role: 'waket2', email: 'waket2@sttw.ac.id', desc: 'HRM Laporan Tendik PDF' },
  { uri: 'lpm/admin/export/kebijakan', role: 'admin-lpm', email: 'admin-lpm@sttw.ac.id', desc: 'LPM Export Kebijakan' },
  { uri: 'lpm/admin/export/pelaksanaan', role: 'admin-lpm', email: 'admin-lpm@sttw.ac.id', desc: 'LPM Export Pelaksanaan' },
  { uri: 'lpm/admin/export/evaluasi', role: 'admin-lpm', email: 'admin-lpm@sttw.ac.id', desc: 'LPM Export Evaluasi' },
  { uri: 'lpm/admin/export/pengendalian', role: 'admin-lpm', email: 'admin-lpm@sttw.ac.id', desc: 'LPM Export Pengendalian' },
  { uri: 'lpm/admin/export/peningkatan', role: 'admin-lpm', email: 'admin-lpm@sttw.ac.id', desc: 'LPM Export Peningkatan' },
  { uri: 'lpm/admin/export/ppepp', role: 'admin-lpm', email: 'admin-lpm@sttw.ac.id', desc: 'LPM Export PPEPP' },
  { uri: 'lpm/admin/export/standar-institusi', role: 'admin-lpm', email: 'admin-lpm@sttw.ac.id', desc: 'LPM Export Standar Institusi' },
  { uri: 'lpm/admin/export/standar-lain', role: 'admin-lpm', email: 'admin-lpm@sttw.ac.id', desc: 'LPM Export Standar Lain' },
  { uri: 'p3m/admin/export/arsip-dosen', role: 'admin', email: 'admin@sttw.ac.id', desc: 'P3M Export Arsip Dosen' },
  { uri: 'p3m/admin/export/arsip-hki', role: 'admin', email: 'admin@sttw.ac.id', desc: 'P3M Export Arsip HKI' },
  { uri: 'p3m/admin/export/arsip-katalog', role: 'admin', email: 'admin@sttw.ac.id', desc: 'P3M Export Arsip Katalog' },
  { uri: 'p3m/admin/export/arsip-penelitian', role: 'admin', email: 'admin@sttw.ac.id', desc: 'P3M Export Arsip Penelitian' },
  { uri: 'p3m/admin/export/arsip-pengabdian', role: 'admin', email: 'admin@sttw.ac.id', desc: 'P3M Export Arsip Pengabdian' },
  { uri: 'p3m/admin/export/arsip-publikasi', role: 'admin', email: 'admin@sttw.ac.id', desc: 'P3M Export Arsip Publikasi' },
  { uri: 'p3m/admin/semua-data/penelitian/export', role: 'admin', email: 'admin@sttw.ac.id', desc: 'P3M Export Semua Penelitian' },
  { uri: 'p3m/admin/semua-data/pengabdian/export', role: 'admin', email: 'admin@sttw.ac.id', desc: 'P3M Export Semua Pengabdian' },
  { uri: 'siakad/dosen/export', role: 'admin', email: 'admin@sttw.ac.id', desc: 'Siakad Export Dosen' },
  { uri: 'siakad/dosen/download-template', role: 'admin', email: 'admin@sttw.ac.id', desc: 'Siakad Download Template Dosen' },
  { uri: 'siakad/mahasiswa/export', role: 'admin', email: 'admin@sttw.ac.id', desc: 'Siakad Export Mahasiswa' },
  { uri: 'siakad/mahasiswa/download-template', role: 'admin', email: 'admin@sttw.ac.id', desc: 'Siakad Download Template Mahasiswa' },
  { uri: 'siakad/staf/export', role: 'admin', email: 'admin@sttw.ac.id', desc: 'Siakad Export Staf' },
  { uri: 'siakad/staf/download-template', role: 'admin', email: 'admin@sttw.ac.id', desc: 'Siakad Download Template Staf' },
  { uri: 'siakad/monitoring-krs/export/rekap', role: 'admin', email: 'admin@sttw.ac.id', desc: 'Siakad Export Rekap KRS' },
  { uri: 'siakad/monitoring-krs/export/status-krs', role: 'admin', email: 'admin@sttw.ac.id', desc: 'Siakad Export Status KRS' },
  { uri: 'siakad/monitoring-krs/export/belum-krs', role: 'admin', email: 'admin@sttw.ac.id', desc: 'Siakad Export Belum KRS' },
  { uri: 'siska/pkl/monitoring/export', role: 'admin', email: 'admin@sttw.ac.id', desc: 'PKL Monitoring Export' },
  { uri: 'siska/kkn/monitoring/export', role: 'admin', email: 'admin@sttw.ac.id', desc: 'KKN Monitoring Export' },
  { uri: 'siska/ta/monitoring/export', role: 'admin', email: 'admin@sttw.ac.id', desc: 'TA Monitoring Export' },
  { uri: 'siska/skripsi/monitoring/export', role: 'admin', email: 'admin@sttw.ac.id', desc: 'Skripsi Monitoring Export' },
  { uri: 'siakad/cetak-dokumen-akademik', role: 'admin', email: 'admin@sttw.ac.id', desc: 'Cetak Dokumen Akademik Index' },
  { uri: 'siakad/cetak-dokumen-akademik/bulk-khs', role: 'admin', email: 'admin@sttw.ac.id', desc: 'Bulk Cetak KHS' },
  { uri: 'mahasiswa/khs/print', role: 'mahasiswa', email: 'mahasiswa@sttw.ac.id', desc: 'Mahasiswa Print KHS' },
  { uri: 'mahasiswa/khs/transkrip/print', role: 'mahasiswa', email: 'mahasiswa@sttw.ac.id', desc: 'Mahasiswa Print Transkrip' },
];

async function login(page, email) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 10000 });
  if (!page.url().includes('/login')) {
    await page.evaluate(async () => {
      const form = document.createElement('form');
      form.method = 'POST'; form.action = '/logout';
      const t = document.querySelector('meta[name="csrf-token"]')?.content || '';
      form.innerHTML = `<input type="hidden" name="_token" value="${t}">`;
      document.body.appendChild(form); form.submit();
    }).catch(() => {});
    await page.waitForTimeout(2000);
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 10000 });
  }
  await page.fill('input[name="login"]', email);
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  if (page.url().includes('/login')) throw new Error(`Login failed for ${email}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  let currentEmail = null;
  let context = null;
  let page = null;

  for (const route of EXPORT_ROUTES) {
    if (route.email !== currentEmail) {
      if (context) await context.close();
      context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        ignoreHTTPSErrors: true,
        acceptDownloads: true
      });
      page = await context.newPage();
      try {
        await login(page, route.email);
        currentEmail = route.email;
        console.log(`✓ Logged in as ${route.email}`);
      } catch(e) {
        results.push({ uri: route.uri, desc: route.desc, role: route.role, status: 'LOGIN_FAIL', error: e.message });
        currentEmail = null;
        continue;
      }
    }

    const ssName = route.uri.replace(/\//g, '_') + '.png';
    const ssPath = path.join(SS_DIR, ssName);

    try {
      console.log(`  Testing: ${route.desc} (${route.uri})...`);
      
      // Use Promise.race to handle both downloads and normal page loads
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 20000 }).catch(() => null),
        page.goto(`${BASE_URL}/${route.uri}`, { waitUntil: 'commit', timeout: 20000 }).catch(() => null),
      ]);

      if (download) {
        // It's a download!
        const fileName = download.suggestedFilename();
        const dlPath = path.join(DL_DIR, fileName);
        try {
          await download.saveAs(dlPath);
          const size = fs.statSync(dlPath).size;
          results.push({
            uri: route.uri, desc: route.desc, role: route.role,
            status: 'DOWNLOAD_OK', fileName, fileSize: size,
            fileSizeKB: (size/1024).toFixed(1), screenshot: ssName, hasError: false
          });
          console.log(`  ✅ ${route.desc}: Downloaded ${fileName} (${(size/1024).toFixed(1)} KB)`);
        } catch(dlErr) {
          // Download failed (maybe empty or error)
          const failure = await download.failure();
          results.push({
            uri: route.uri, desc: route.desc, role: route.role,
            status: 'DOWNLOAD_FAIL', error: failure || dlErr.message, hasError: true, screenshot: ssName
          });
          console.log(`  ❌ ${route.desc}: Download failed - ${failure || dlErr.message}`);
        }
        await page.screenshot({ path: ssPath, fullPage: true }).catch(() => {});
      } else {
        // Normal page response
        await page.waitForTimeout(1500);
        const status = await page.evaluate(() => {
          // Check for error indicators
          const body = document.body?.innerText || '';
          if (body.includes('Whoops') || body.includes('Server Error')) return 500;
          if (body.includes('Not Found')) return 404;
          if (body.includes('Forbidden')) return 403;
          return 200;
        });
        
        await page.screenshot({ path: ssPath, fullPage: true });
        
        const html = await page.content();
        const hasLaravelError = html.includes('Whoops') || html.includes('Server Error') || html.includes('ErrorException');
        const actualStatus = hasLaravelError ? 500 : status;
        
        results.push({
          uri: route.uri, desc: route.desc, role: route.role,
          status: actualStatus, isPage: true, hasError: actualStatus >= 400,
          screenshot: ssName
        });
        
        if (actualStatus >= 400) {
          console.log(`  ❌ ${route.desc}: HTTP ${actualStatus}`);
        } else {
          console.log(`  ✅ ${route.desc}: Page OK (${actualStatus})`);
        }
      }
    } catch(e) {
      await page.screenshot({ path: ssPath, fullPage: true }).catch(() => {});
      results.push({
        uri: route.uri, desc: route.desc, role: route.role,
        status: 'ERROR', error: e.message.split('\n')[0], hasError: true, screenshot: ssName
      });
      console.log(`  ❌ ${route.desc}: ${e.message.split('\n')[0]}`);
    }
  }

  if (context) await context.close();
  await browser.close();

  fs.writeFileSync(path.join(AUDIT_DIR, 'export-results.json'), JSON.stringify(results, null, 2));

  const total = results.length;
  const dlOk = results.filter(r => r.status === 'DOWNLOAD_OK').length;
  const pageOk = results.filter(r => r.status === 200).length;
  const errors = results.filter(r => r.hasError).length;
  
  console.log(`\n=== EXPORT AUDIT SUMMARY ===`);
  console.log(`Total: ${total} | 📥 Downloads OK: ${dlOk} | 📄 Pages OK: ${pageOk} | ❌ Errors: ${errors}`);
  
  if (dlOk > 0) {
    console.log('\nSuccessful downloads:');
    results.filter(r => r.status === 'DOWNLOAD_OK').forEach(r => {
      console.log(`  📥 ${r.desc}: ${r.fileName} (${r.fileSizeKB} KB)`);
    });
  }
  if (errors > 0) {
    console.log('\nErrors:');
    results.filter(r => r.hasError).forEach(r => {
      console.log(`  ❌ ${r.desc} (${r.uri}): ${r.error || `HTTP ${r.status}`}`);
    });
  }
})();
