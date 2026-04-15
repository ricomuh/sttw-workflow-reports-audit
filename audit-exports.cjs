// SIAKAD STTW Export/Download Audit
// Tests all export routes (PDF, Excel, downloads) and captures results
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://sttw-dev.leolitgames.com';
const AUDIT_DIR = '/home/ubuntu/siakad-sttw-audit/exports';
const SS_DIR = path.join(AUDIT_DIR, 'screenshots');
fs.mkdirSync(SS_DIR, { recursive: true });

// Role-to-route mapping for exports
const EXPORT_ROUTES = [
  // HRM Exports (waket2)
  { uri: 'hrm/laporan/dosen/export', role: 'waket2', email: 'waket2@sttw.ac.id', desc: 'HRM Laporan Dosen Excel' },
  { uri: 'hrm/laporan/dosen/export-pdf', role: 'waket2', email: 'waket2@sttw.ac.id', desc: 'HRM Laporan Dosen PDF' },
  { uri: 'hrm/laporan/tendik/export', role: 'waket2', email: 'waket2@sttw.ac.id', desc: 'HRM Laporan Tendik Excel' },
  { uri: 'hrm/laporan/tendik/export-pdf', role: 'waket2', email: 'waket2@sttw.ac.id', desc: 'HRM Laporan Tendik PDF' },
  
  // LPM Exports (admin-lpm)
  { uri: 'lpm/admin/export/kebijakan', role: 'admin-lpm', email: 'admin-lpm@sttw.ac.id', desc: 'LPM Export Kebijakan' },
  { uri: 'lpm/admin/export/pelaksanaan', role: 'admin-lpm', email: 'admin-lpm@sttw.ac.id', desc: 'LPM Export Pelaksanaan' },
  { uri: 'lpm/admin/export/evaluasi', role: 'admin-lpm', email: 'admin-lpm@sttw.ac.id', desc: 'LPM Export Evaluasi' },
  { uri: 'lpm/admin/export/pengendalian', role: 'admin-lpm', email: 'admin-lpm@sttw.ac.id', desc: 'LPM Export Pengendalian' },
  { uri: 'lpm/admin/export/peningkatan', role: 'admin-lpm', email: 'admin-lpm@sttw.ac.id', desc: 'LPM Export Peningkatan' },
  { uri: 'lpm/admin/export/ppepp', role: 'admin-lpm', email: 'admin-lpm@sttw.ac.id', desc: 'LPM Export PPEPP' },
  { uri: 'lpm/admin/export/standar-institusi', role: 'admin-lpm', email: 'admin-lpm@sttw.ac.id', desc: 'LPM Export Standar Institusi' },
  { uri: 'lpm/admin/export/standar-lain', role: 'admin-lpm', email: 'admin-lpm@sttw.ac.id', desc: 'LPM Export Standar Lain' },
  
  // P3M Exports (admin)
  { uri: 'p3m/admin/export/arsip-dosen', role: 'admin', email: 'admin@sttw.ac.id', desc: 'P3M Export Arsip Dosen' },
  { uri: 'p3m/admin/export/arsip-hki', role: 'admin', email: 'admin@sttw.ac.id', desc: 'P3M Export Arsip HKI' },
  { uri: 'p3m/admin/export/arsip-katalog', role: 'admin', email: 'admin@sttw.ac.id', desc: 'P3M Export Arsip Katalog' },
  { uri: 'p3m/admin/export/arsip-penelitian', role: 'admin', email: 'admin@sttw.ac.id', desc: 'P3M Export Arsip Penelitian' },
  { uri: 'p3m/admin/export/arsip-pengabdian', role: 'admin', email: 'admin@sttw.ac.id', desc: 'P3M Export Arsip Pengabdian' },
  { uri: 'p3m/admin/export/arsip-publikasi', role: 'admin', email: 'admin@sttw.ac.id', desc: 'P3M Export Arsip Publikasi' },
  { uri: 'p3m/admin/semua-data/penelitian/export', role: 'admin', email: 'admin@sttw.ac.id', desc: 'P3M Export Semua Penelitian' },
  { uri: 'p3m/admin/semua-data/pengabdian/export', role: 'admin', email: 'admin@sttw.ac.id', desc: 'P3M Export Semua Pengabdian' },
  
  // Siakad Exports (admin)
  { uri: 'siakad/dosen/export', role: 'admin', email: 'admin@sttw.ac.id', desc: 'Siakad Export Dosen' },
  { uri: 'siakad/dosen/download-template', role: 'admin', email: 'admin@sttw.ac.id', desc: 'Siakad Download Template Dosen' },
  { uri: 'siakad/mahasiswa/export', role: 'admin', email: 'admin@sttw.ac.id', desc: 'Siakad Export Mahasiswa' },
  { uri: 'siakad/mahasiswa/download-template', role: 'admin', email: 'admin@sttw.ac.id', desc: 'Siakad Download Template Mahasiswa' },
  { uri: 'siakad/staf/export', role: 'admin', email: 'admin@sttw.ac.id', desc: 'Siakad Export Staf' },
  { uri: 'siakad/staf/download-template', role: 'admin', email: 'admin@sttw.ac.id', desc: 'Siakad Download Template Staf' },
  { uri: 'siakad/monitoring-krs/export/rekap', role: 'admin', email: 'admin@sttw.ac.id', desc: 'Siakad Export Rekap KRS' },
  { uri: 'siakad/monitoring-krs/export/status-krs', role: 'admin', email: 'admin@sttw.ac.id', desc: 'Siakad Export Status KRS' },
  { uri: 'siakad/monitoring-krs/export/belum-krs', role: 'admin', email: 'admin@sttw.ac.id', desc: 'Siakad Export Belum KRS' },
  
  // SISKA PKL Exports (admin)
  { uri: 'siska/pkl/monitoring/export', role: 'admin', email: 'admin@sttw.ac.id', desc: 'PKL Monitoring Export' },
  
  // SISKA KKN Exports (admin)
  { uri: 'siska/kkn/monitoring/export', role: 'admin', email: 'admin@sttw.ac.id', desc: 'KKN Monitoring Export' },
  
  // SISKA TA Exports (admin)
  { uri: 'siska/ta/monitoring/export', role: 'admin', email: 'admin@sttw.ac.id', desc: 'TA Monitoring Export' },
  
  // SISKA Skripsi Exports (admin)
  { uri: 'siska/skripsi/monitoring/export', role: 'admin', email: 'admin@sttw.ac.id', desc: 'Skripsi Monitoring Export' },
  
  // Cetak Dokumen Akademik (admin)
  { uri: 'siakad/cetak-dokumen-akademik', role: 'admin', email: 'admin@sttw.ac.id', desc: 'Cetak Dokumen Akademik Index' },
  { uri: 'siakad/cetak-dokumen-akademik/bulk-khs', role: 'admin', email: 'admin@sttw.ac.id', desc: 'Bulk Cetak KHS' },
  
  // Mahasiswa KHS Print (mahasiswa)
  { uri: 'mahasiswa/khs/print', role: 'mahasiswa', email: 'mahasiswa@sttw.ac.id', desc: 'Mahasiswa Print KHS' },
  { uri: 'mahasiswa/khs/transkrip/print', role: 'mahasiswa', email: 'mahasiswa@sttw.ac.id', desc: 'Mahasiswa Print Transkrip' },
];

async function login(page, email) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 10000 });
  const url = page.url();
  if (!url.includes('/login')) {
    // Need to logout first
    await page.evaluate(async () => {
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = '/logout';
      const token = document.querySelector('meta[name="csrf-token"]')?.content || '';
      form.innerHTML = `<input type="hidden" name="_token" value="${token}">`;
      document.body.appendChild(form);
      form.submit();
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
    // Switch user if needed
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
        console.log(`✗ Login failed for ${route.email}: ${e.message}`);
        results.push({ ...route, status: 0, error: `Login failed: ${e.message}`, fileType: null, fileName: null });
        currentEmail = null;
        continue;
      }
    }

    const ssName = route.uri.replace(/\//g, '_') + '.png';
    const ssPath = path.join(SS_DIR, ssName);

    try {
      console.log(`  Testing: ${route.desc} (${route.uri})...`);
      
      // Set up download listener
      let downloadFile = null;
      let downloadError = null;
      const downloadPromise = page.waitForEvent('download', { timeout: 15000 }).catch(e => null);
      
      // Navigate
      const resp = await page.goto(`${BASE_URL}/${route.uri}`, {
        waitUntil: 'domcontentloaded',
        timeout: 20000
      });

      const status = resp?.status() || 0;
      const contentType = resp?.headers()?.['content-type'] || '';
      const contentDisposition = resp?.headers()?.['content-disposition'] || '';
      
      // Check if it's a download (PDF/Excel/etc) vs a page
      const isDownload = contentType.includes('application/pdf') ||
                         contentType.includes('spreadsheet') ||
                         contentType.includes('excel') ||
                         contentType.includes('octet-stream') ||
                         contentType.includes('csv') ||
                         contentDisposition.includes('attachment');
      
      const isPdfInline = contentType.includes('application/pdf') && !contentDisposition.includes('attachment');
      
      // Try to get download
      const download = await downloadPromise;
      
      let fileName = null;
      let fileSize = 0;
      let fileSaved = null;
      
      if (download) {
        fileName = download.suggestedFilename();
        const downloadPath = path.join(AUDIT_DIR, 'downloads', fileName);
        fs.mkdirSync(path.join(AUDIT_DIR, 'downloads'), { recursive: true });
        await download.saveAs(downloadPath);
        fileSize = fs.statSync(downloadPath).size;
        fileSaved = downloadPath;
        console.log(`    📥 Downloaded: ${fileName} (${(fileSize/1024).toFixed(1)} KB)`);
      }
      
      // Take screenshot of whatever is shown
      await page.waitForTimeout(1000);
      await page.screenshot({ path: ssPath, fullPage: true });
      
      // Check for errors
      const html = await page.content();
      const hasError = html.includes('Whoops') || html.includes('Server Error') || 
                       html.includes('ErrorException') || status >= 400;
      
      const errorMsg = [];
      if (status >= 500) errorMsg.push(`HTTP ${status}`);
      if (status === 404) errorMsg.push('404 Not Found');
      if (status === 403) errorMsg.push('403 Forbidden');
      if (html.includes('Whoops')) errorMsg.push('Laravel Error');
      
      const result = {
        uri: route.uri,
        desc: route.desc,
        role: route.role,
        status,
        contentType: contentType.split(';')[0],
        isDownload: isDownload || !!download,
        fileName,
        fileSize,
        fileSaved,
        hasError,
        errors: errorMsg,
        screenshot: ssName
      };
      
      results.push(result);
      
      if (hasError) {
        console.log(`  ❌ ${route.desc}: ${errorMsg.join(', ')}`);
      } else if (download || isDownload) {
        console.log(`  ✅ ${route.desc}: Download OK (${contentType.split(';')[0]})`);
      } else {
        console.log(`  ✅ ${route.desc}: Page OK (${status})`);
      }
      
    } catch(e) {
      // Some exports trigger downloads which cause navigation to abort
      // This is expected behavior
      const errMsg = e.message.split('\n')[0];
      
      // Check if a download happened despite the error
      const downloads = path.join(AUDIT_DIR, 'downloads');
      fs.mkdirSync(downloads, { recursive: true });
      
      await page.screenshot({ path: ssPath, fullPage: true }).catch(() => {});
      
      results.push({
        uri: route.uri,
        desc: route.desc,
        role: route.role,
        status: 0,
        contentType: null,
        isDownload: false,
        fileName: null,
        fileSize: 0,
        hasError: true,
        errors: [errMsg],
        screenshot: ssName
      });
      console.log(`  ⚠️ ${route.desc}: ${errMsg}`);
    }
  }

  if (context) await context.close();
  await browser.close();

  // Write results
  fs.writeFileSync(path.join(AUDIT_DIR, 'export-results.json'), JSON.stringify(results, null, 2));

  // Print summary
  const total = results.length;
  const ok = results.filter(r => !r.hasError).length;
  const errors = results.filter(r => r.hasError).length;
  const downloads = results.filter(r => r.isDownload).length;
  
  console.log(`\n=== EXPORT AUDIT SUMMARY ===`);
  console.log(`Total: ${total} | ✅ OK: ${ok} | ❌ Errors: ${errors} | 📥 Downloads: ${downloads}`);
  
  if (errors > 0) {
    console.log('\nErrors:');
    results.filter(r => r.hasError).forEach(r => {
      console.log(`  ${r.desc} (${r.uri}): ${r.errors.join(', ')}`);
    });
  }
})();
